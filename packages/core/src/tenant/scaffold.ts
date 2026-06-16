import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TenantOnboardingInput } from "./onboarding";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(MODULE_DIR, "../../../..");
const TEMPLATE_DIR = path.join(ROOT, "packages", "dealers", "template");
const REGISTRY_FILE = path.join(ROOT, "packages", "dealers", "registry", "src", "index.ts");

function slugToCamelCase(slug: string) {
    return slug
        .split(/[^a-zA-Z0-9]/)
        .filter(Boolean)
        .map((segment, index) => {
            const lower = segment.toLowerCase();
            return index === 0 ? lower : lower[0]?.toUpperCase() + lower.slice(1);
        })
        .join("");
}

async function copyDir(source: string, target: string) {
    await fs.mkdir(target, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            await copyDir(sourcePath, targetPath);
            continue;
        }

        await fs.copyFile(sourcePath, targetPath);
    }
}

async function replaceTokens(rootDir: string, replacements: Record<string, string>) {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });

    for (const entry of entries) {
        const filePath = path.join(rootDir, entry.name);

        if (entry.isDirectory()) {
            await replaceTokens(filePath, replacements);
            continue;
        }

        const source = await fs.readFile(filePath, "utf8");
        const next = Object.entries(replacements).reduce(
            (content, [token, value]) => content.replaceAll(token, value),
            source,
        );

        await fs.writeFile(filePath, next);
    }
}

function insertBetweenMarkers(source: string, startMarker: string, endMarker: string, line: string) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker);

    if (start === -1 || end === -1 || end <= start) {
        throw new Error(`Could not find marker pair: ${startMarker} / ${endMarker}`);
    }

    const before = source.slice(0, start + startMarker.length);
    const between = source.slice(start + startMarker.length, end);
    const after = source.slice(end);
    const normalized = between.trimEnd();

    if (normalized.includes(line.trim())) {
        return source;
    }

    const insertion = `${normalized}\n${line}`;
    return `${before}\n${insertion}\n${after}`;
}

async function updateRegistry(slug: string, exportName: string) {
    const current = await fs.readFile(REGISTRY_FILE, "utf8");
    const importLine = `import { ${exportName} } from "../../${slug}/src";`;
    const entryLine = `    [${exportName}.slug]: ${exportName},`;

    let next = insertBetweenMarkers(current, "// dealer-imports:start", "// dealer-imports:end", importLine);
    next = insertBetweenMarkers(next, "// dealer-entries:start", "// dealer-entries:end", entryLine);
    await fs.writeFile(REGISTRY_FILE, next);
}

function getDealerPackageDir(slug: string) {
    return path.join(ROOT, "packages", "dealers", slug);
}

export async function dealerPackageExists(slug: string) {
    try {
        await fs.access(getDealerPackageDir(slug));
        return true;
    } catch {
        return false;
    }
}

export async function scaffoldDealerPackage(input: TenantOnboardingInput) {
    const dealerDir = getDealerPackageDir(input.slug);
    const exportName = `${slugToCamelCase(input.slug)}TenantBootstrap`;
    const blueprintPath = path.join(dealerDir, "client.blueprint.json");

    if (await dealerPackageExists(input.slug)) {
        throw new Error(`Dealer package already exists for slug "${input.slug}".`);
    }

    await copyDir(TEMPLATE_DIR, dealerDir);
    await replaceTokens(dealerDir, {
        "__DEALER_SLUG__": input.slug,
        "__DEALER_SLUG_CAMEL__": slugToCamelCase(input.slug),
        "__DEALER_NAME__": input.name,
        "__DEALER_DISPLAY_NAME__": input.displayName,
        "__DEALER_ADMIN_DISPLAY_NAME__": input.adminDisplayName,
        "__DEALER_LEGAL_NAME__": input.legalName,
        "__DEALER_SUPPORT_EMAIL__": input.supportEmail,
        "__DEALER_PHONE__": input.phone,
        "__DEALER_WHATSAPP_NUMBER__": input.whatsappNumber,
        "__DEALER_PRIMARY_DOMAIN__": input.primaryDomain,
        "__DEALER_ADDRESS_LINE__": input.addressLine,
        "__DEALER_POSTAL_CODE__": input.postalCode,
        "__DEALER_CITY__": input.city,
        "__DEALER_REGION__": input.region,
        "__DEALER_COUNTRY_CODE__": input.countryCode,
        "__DEALER_TIMEZONE__": input.timeZone,
        "__DEALER_CURRENCY__": input.currency,
        "__DEALER_R2_PREFIX__": input.r2KeyPrefix,
        "__DEALER_SESSION_CONTEXT__": input.sessionContext,
    });
    await updateRegistry(input.slug, exportName);

    await fs.writeFile(
        blueprintPath,
        JSON.stringify(
            {
                slug: input.slug,
                displayName: input.displayName,
                primaryDomain: input.primaryDomain,
                siteUrl: input.siteUrl,
                themePreset: input.themePreset,
                features: input.features,
                notes: input.notes,
                publicFrontendStatus: "todo",
                createdAt: new Date().toISOString(),
            },
            null,
            2,
        ),
        "utf8",
    );

    return {
        packageDir: dealerDir,
        blueprintPath,
        exportName,
    };
}
