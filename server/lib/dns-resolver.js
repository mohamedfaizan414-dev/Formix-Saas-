const dns = require("dns");

function resolveMongoSrv(connectionString) {
  return new Promise((resolve) => {
    if (!connectionString || !connectionString.startsWith("mongodb+srv://")) {
      return resolve(connectionString);
    }

    try {
      const urlPattern = /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)(.*)$/;
      const match = connectionString.match(urlPattern);
      if (!match) {
        return resolve(connectionString);
      }

      const [_, user, pass, host, db, query] = match;
      const srvDomain = `_mongodb._tcp.${host}`;

      // Helper function to resolve using a given resolver/dns module
      const tryResolve = (dnsModule, callback) => {
        dnsModule.resolveSrv(srvDomain, (srvErr, srvAddresses) => {
          if (srvErr || !srvAddresses || srvAddresses.length === 0) {
            return callback(srvErr || new Error("No SRV records"));
          }
          dnsModule.resolveTxt(host, (txtErr, txtRecords) => {
            callback(null, { srvAddresses, txtRecords: txtErr ? null : txtRecords });
          });
        });
      };

      // 1. Try standard OS DNS first
      tryResolve(dns, (err, result) => {
        if (!err) {
          console.log("[DNS Resolver] Programmatically resolved MongoDB Atlas SRV using System DNS.");
          return handleResult(result);
        }

        // 2. Fallback to Google DNS resolver
        console.warn("[DNS Resolver] System DNS resolution failed, attempting Google DNS fallback...");
        const googleResolver = new dns.Resolver();
        try {
          googleResolver.setServers(["8.8.8.8", "8.8.4.4"]);
          tryResolve(googleResolver, (gErr, gResult) => {
            if (!gErr) {
              console.log("[DNS Resolver] Programmatically resolved MongoDB Atlas SRV using Google DNS.");
              return handleResult(gResult);
            }
            console.error("[DNS Resolver] Both System and Google DNS failed. Falling back to original connection string.");
            resolve(connectionString);
          });
        } catch (gSetupErr) {
          console.error("[DNS Resolver] Google DNS setup error. Falling back to original connection string.");
          resolve(connectionString);
        }
      });

      function handleResult(result) {
        const { srvAddresses, txtRecords } = result;
        const hosts = srvAddresses
          .map(addr => {
            let name = addr.name;
            if (name.endsWith(".")) name = name.slice(0, -1);
            return `${name}:${addr.port}`;
          })
          .join(",");

        const params = new URLSearchParams();
        params.set("ssl", "true");
        params.set("authSource", "admin");

        if (txtRecords) {
          const txtParamsString = txtRecords.flat().join("&");
          if (txtParamsString) {
            const txtParams = new URLSearchParams(txtParamsString);
            for (const [key, val] of txtParams.entries()) {
              params.set(key, val);
            }
          }
        }

        if (query && query.startsWith("?")) {
          const queryParams = new URLSearchParams(query.substring(1));
          for (const [key, val] of queryParams.entries()) {
            params.set(key, val);
          }
        }

        const resolvedUrl = `mongodb://${user}:${pass}@${hosts}/${db}?${params.toString()}`;
        resolve(resolvedUrl);
      }
    } catch (err) {
      console.warn("[DNS Resolver] Parsing error:", err.message);
      resolve(connectionString);
    }
  });
}

module.exports = {
  resolveMongoSrv
};
