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
      const resolver = new dns.Resolver();
      resolver.setServers(["8.8.8.8", "8.8.4.4"]); // Resolve SRV records via Google DNS

      const srvDomain = `_mongodb._tcp.${host}`;
      resolver.resolveSrv(srvDomain, (srvErr, srvAddresses) => {
        if (srvErr) {
          console.warn("[DNS Resolver] Custom SRV lookup failed, falling back to OS DNS:", srvErr.message);
          return resolve(connectionString);
        }

        if (!srvAddresses || srvAddresses.length === 0) {
          return resolve(connectionString);
        }

        // map names and remove any trailing dot that Node resolvesrv returns
        const hosts = srvAddresses
          .map(addr => {
            let name = addr.name;
            if (name.endsWith(".")) name = name.slice(0, -1);
            return `${name}:${addr.port}`;
          })
          .join(",");
        
        resolver.resolveTxt(host, (txtErr, txtRecords) => {
          const params = new URLSearchParams();
          
          // Set default connection options
          params.set("ssl", "true");
          params.set("authSource", "admin");

          // Merge params from TXT records
          if (!txtErr && txtRecords) {
            const txtParamsString = txtRecords.flat().join("&");
            if (txtParamsString) {
              const txtParams = new URLSearchParams(txtParamsString);
              for (const [key, val] of txtParams.entries()) {
                params.set(key, val);
              }
            }
          }

          // Merge params from original query string
          if (query && query.startsWith("?")) {
            const queryParams = new URLSearchParams(query.substring(1));
            for (const [key, val] of queryParams.entries()) {
              params.set(key, val);
            }
          }

          const resolvedUrl = `mongodb://${user}:${pass}@${hosts}/${db}?${params.toString()}`;
          console.log("[DNS Resolver] Programmatically resolved MongoDB Atlas SRV to standard nodes format.");
          resolve(resolvedUrl);
        });
      });
    } catch (err) {
      console.warn("[DNS Resolver] Parsing error:", err.message);
      resolve(connectionString);
    }
  });
}

module.exports = {
  resolveMongoSrv
};
