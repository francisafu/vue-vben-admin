import { createJiti } from "../../../../../node_modules/.pnpm/jiti@2.6.1/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "@vben-core/shared": "/home/francis/repo/framilysales_assistant_v5/frontend/packages/@core/base/shared"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/francis/repo/framilysales_assistant_v5/frontend/packages/@core/base/shared/src/store.js")} */
const _module = await jiti.import("/home/francis/repo/framilysales_assistant_v5/frontend/packages/@core/base/shared/src/store.ts");

export const shallow = _module.shallow;
export const useStore = _module.useStore;
export const ReadonlyStore = _module.ReadonlyStore;
export const Store = _module.Store;
export const batch = _module.batch;
export const createAsyncAtom = _module.createAsyncAtom;
export const createAtom = _module.createAtom;
export const createStore = _module.createStore;
export const flush = _module.flush;
export const toObserver = _module.toObserver;