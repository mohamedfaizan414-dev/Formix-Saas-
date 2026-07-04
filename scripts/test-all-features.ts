// scripts/test-all-features.ts
import { PrismaClient, RoleName, FormStatus, SubmissionStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import { evaluateRule, evaluateGroup, computeRuntimeState } from "../lib/form-engine/conditional-engine";
import { buildZodSchemaForNodes } from "../lib/form-engine/build-zod-schema";
import { roleHasPermission } from "../lib/rbac/permissions";
import type { FormSchema, FormComponentNode } from "../lib/form-engine/types";

const prisma = new PrismaClient();

async function runTestSuite() {
  console.log("🚀 STARTING ULTIMATE FORMIX CLINICAL INTEGRATION & ENGINE TEST SUITE...");
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      failedTests++;
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    } else {
      passedTests++;
      console.log(`✅ PASS: ${message}`);
    }
  }

  try {
    // --- TEST 1: ROLE-BASED ACCESS CONTROL MATRIX VALIDATION ---
    console.log("\n--- Testing Module 1: Role-Based Access Control ---");
    assert(roleHasPermission("SUPER_ADMIN", "form.create") === true, "Super Admin must be authorized to create forms.");
    assert(roleHasPermission("SUPER_ADMIN", "hospital.toggleActive") === true, "Super Admin must be authorized to toggle hospital status.");
    assert(roleHasPermission("HOSPITAL_ADMIN", "form.create") === true, "Hospital Admin must be authorized to create forms.");
    assert(roleHasPermission("HOSPITAL_ADMIN", "hospital.manage") === false, "Hospital Admin must not be authorized to manage multi-tenant hospitals.");
    assert(roleHasPermission("DOCTOR", "submission.create") === true, "Doctors must be authorized to record encounters.");
    assert(roleHasPermission("DOCTOR", "form.publish") === false, "Doctors must not be authorized to publish configurations.");
    assert(roleHasPermission("RECEPTIONIST", "submission.create") === true, "Receptionists must be authorized to record intake information.");
    assert(roleHasPermission("RECEPTIONIST", "submission.edit") === false, "Receptionists must be blocked from altering finalized records.");

    // --- TEST 2: CONDITIONAL LOGIC RUNTIME ENGINE CALCULATIONS ---
    console.log("\n--- Testing Module 2: Conditional Evaluation Engine ---");
    const mockValues = { gender: "female", age: 28, systolic: 135 };
    
    const equalsRule = { id: "r1", field: "gender", operator: "equals" as const, value: "female" };
    const greaterRule = { id: "r2", field: "systolic", operator: "greaterThan" as const, value: 130 };
    const emptyRule = { id: "r3", field: "notes", operator: "isEmpty" as const };

    assert(evaluateRule(equalsRule, mockValues) === true, "Operator 'equals' failed string equality matching.");
    assert(evaluateRule(greaterRule, mockValues) === true, "Operator 'greaterThan' failed numeric tracking checks.");
    assert(evaluateRule(emptyRule, mockValues) === true, "Operator 'isEmpty' failed missing value identification.");

    const mockSchema: FormSchema = {
      title: "Cardiac Review Unit",
      layout: "single",
      sections: [{
        id: "sec_1",
        title: "Vitals Check",
        components: [
          { id: "f_gender", type: "dropdown", internalName: "gender", validation: { required: true }, display: {} },
          { id: "f_preg", type: "text", internalName: "pregnancy_weeks", validation: { hidden: true }, display: {} }
        ]
      }],
      conditionalRules: [{
        id: "rule_preg",
        name: "Pregnancy Track Trigger",
        when: { id: "g1", combinator: "AND", rules: [equalsRule] },
        action: "show",
        targetFieldIds: ["f_preg"]
      }]
    };

    const runtimeState = computeRuntimeState(snapshot(mockSchema), mockValues);
    assert(runtimeState.fields["f_preg"].visible === true, "Conditional show action failed to overwrite validation visibility constraints.");

    // --- TEST 3: DYNAMIC DYNAMIC SCHEMAS AND RUNTIME ZOD COMPILATION ---
    console.log("\n--- Testing Module 3: Zod Compilation Engine ---");
    const activeNodes: FormComponentNode[] = [
      { id: "n1", type: "email", internalName: "patient_email", validation: { required: true }, display: {} },
      { id: "n2", type: "number", internalName: "bpm_rate", validation: { required: false, min: 30, max: 200 }, display: {} }
    ];

    const zodParser = buildZodSchemaForNodes(activeNodes);
    const validParse = zodParser.safeParse({ patient_email: "test@hospital.org", bpm_rate: 72 });
    assert(validParse.success === true, "Zod structural parser rejected well-formed demographic datasets.");
    
    const invalidParse = zodParser.safeParse({ patient_email: "malformed-string", bpm_rate: 250 });
    assert(invalidParse.success === false, "Zod parsing layer failed to detect values outside validation constraints.");

    // --- TEST 4: MULTI-TENANT DATABASE ENFORCEMENT & IMMUTABILITY ---
    console.log("\n--- Testing Module 4: Database Model Integration & Version Control ---");
    
    const testHospital = await prisma.hospital.create({
      data: { name: "Automation Control Lab", slug: `auto-lab-${nanoid(4)}`, isActive: true }
    });

    const testUser = await prisma.user.create({
      data: {
        email: `tester-${nanoid(4)}@formix.dev`,
        firstName: "System",
        lastName: "Verification",
        passwordHash: "dummy-hash",
        roleId: (await prisma.role.findFirst({ where: { name: "HOSPITAL_ADMIN" } }))!.id,
        hospitalId: testHospital.id
      }
    });

    // Verify initial form generation (v1 setup)
    const initialFormSchema: FormSchema = {
      title: "Biometrics Intake",
      layout: "single",
      sections: [{ id: "s1", title: "General", components: [] }],
      conditionalRules: []
    };

    const targetForm = await prisma.form.create({
      data: {
        hospitalId: testHospital.id,
        name: "Standard Lab Metrics",
        slug: `lab-metrics-${nanoid(4)}`,
        status: "DRAFT",
        currentVersion: 1,
        createdById: testUser.id,
        versions: {
          create: {
            versionNumber: 1,
            schema: initialFormSchema as any,
            createdById: testUser.id
          }
        }
      },
      include: { versions: true }
    });
    assert(targetForm.currentVersion === 1, "Form structural baseline failed initialization version numbering parameters.");

    // Verify version control increments (v2 upgrade test)
    const upgradedFormSchema: FormSchema = { ...initialFormSchema, title: "Biometrics Intake v2 (Amended)" };
    const nextVersionNumber = targetForm.currentVersion + 1;

    const [, appendedVersion] = await prisma.$transaction([
      prisma.form.update({
        where: { id: targetForm.id },
        data: { currentVersion: nextVersionNumber }
      }),
      prisma.formVersion.create({
        data: {
          formId: targetForm.id,
          versionNumber: nextVersionNumber,
          schema: upgradedFormSchema as any,
          createdById: testUser.id
        }
      })
    ]);

    assert(appendedVersion.versionNumber === 2, "Transactional configuration changes failed to correctly update version numbers.");

    // Clean up test data
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.hospital.delete({ where: { id: testHospital.id } });

    console.log(`\n🎉 ALL AUTOMATED TESTS EXECUTED SUCCESSFULLY.`);
    console.log(`📊 STATS: [Passed: ${passedTests} | Failed: ${failedTests}]`);
  } catch (error) {
    console.error("\n💥 SYSTEM CRITICAL ERROR ENCOUNTERED DURING TEST SUITE CRADLE EXECUTION!");
    console.error(error);
    process.exit(1);
  }
}

function snapshot<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

runTestSuite().then(() => prisma.$disconnect());