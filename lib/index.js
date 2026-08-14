//#region src/index.ts
/**
* Node half of the Deep Midnight theme plugin.
* This package is primarily a client-side plugin; the node half exists
* only so the Cordis loader can mount the entry and the modules plugin
* can discover the `dsh.client` declaration in package.json.
* @module dsh-any-background
*/
const name = "dsh-any-background";
function apply() {}
//#endregion
export { apply, name };
