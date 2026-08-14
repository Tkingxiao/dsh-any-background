//#region src/invariant.ts
const PACKAGE_NAME = "dsh-theme-plugin";
/** Cordis companion plugin name. */
const name = "dsh-theme-plugin-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the plugin registers a theme definition through the
* existing ThemeRuntime service and emits no cross-plugin mutable state.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
