//#region src/invariant.ts
const PACKAGE_NAME = "dsh-any-background";
const name = "dsh-any-background-invariant";
const inject = ["invariants"];
const install = () => {};
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
