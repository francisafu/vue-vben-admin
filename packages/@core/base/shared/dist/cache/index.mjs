import { createJiti } from "../../../../../../node_modules/.pnpm/jiti@2.4.2/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "@vben-core/shared": "C:/Users/franc/Repo/framilysales_assistant_v5/frontend/packages/@core/base/shared"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("C:/Users/franc/Repo/framilysales_assistant_v5/frontend/packages/@core/base/shared/src/cache/index.js")} */
const _module = await jiti.import("C:/Users/franc/Repo/framilysales_assistant_v5/frontend/packages/@core/base/shared/src/cache/index.ts");

export const StorageManager = _module.StorageManager;