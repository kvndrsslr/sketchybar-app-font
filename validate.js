import fs from "node:fs";
import { pathToFileURL } from "node:url";
import isSvg from "is-svg";

function isValidSVG(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    
    // Check if file is empty
    if (!content.trim()) {
      return { valid: false, error: "File is empty" };
    }
    
    // Use is-svg library for validation
    if (!isSvg(content)) {
      return { valid: false, error: "Not a valid SVG" };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export function validate() {
  const mappingFiles = fs.readdirSync("./mappings");
  const svgFiles = fs.readdirSync("./svgs");

  const mappingNames = new Set(mappingFiles);
  const svgNames = new Set(svgFiles.map((f) => f.replace(".svg", "")));

  let hasErrors = false;

  // Check for malformed SVGs
  const malformedSvgs = [];
  for (const svgFile of svgFiles) {
    const filePath = `./svgs/${svgFile}`;
    const validation = isValidSVG(filePath);
    if (!validation.valid) {
      malformedSvgs.push({ file: svgFile.replace(".svg", ""), error: validation.error });
    }
  }

  if (malformedSvgs.length > 0) {
    console.error("\nError: Invalid SVG files:");
    malformedSvgs.forEach(({ file, error }) => 
      console.error(`   - ${file} - ${error}`)
    );
    hasErrors = true;
  }

  // Check for mappings without corresponding SVGs
  const missingMappings = [];
  for (const mapping of mappingNames) {
    if (!svgNames.has(mapping)) {
      missingMappings.push(mapping);
    }
  }

  if (missingMappings.length > 0) {
    console.error("\nError: Mappings without corresponding SVGs:");
    missingMappings.forEach((m) => console.error(`   - ${m}`));
    hasErrors = true;
  }

  // Report orphaned SVGs (informational, not an error)
  const orphanedSvgs = [];
  for (const svg of svgNames) {
    if (!mappingNames.has(svg)) {
      orphanedSvgs.push(svg);
    }
  }

  if (orphanedSvgs.length > 0) {
    console.log("\nInfo: SVGs without mappings (utility icons):");
    orphanedSvgs.forEach((s) => console.log(`   - ${s}`));
  }

  // Summary
  console.log(`\nValidated ${mappingNames.size} mappings against ${svgNames.size} SVGs`);

  if (hasErrors) {
    console.error("\nValidation failed\n");
    process.exit(1);
  } else {
    console.log("All mappings have corresponding SVGs\n");
  }

  return { hasErrors };
}

// only execute if run directly (ESM)
if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
  validate();
}

