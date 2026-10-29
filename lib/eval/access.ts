export const PUBLIC_RUN_ID='demo-baseline-v1';
export const PUBLIC_REAL_RUN_ID='origin-real-v1';
export const PUBLIC_RUN_IDS=[PUBLIC_RUN_ID,PUBLIC_REAL_RUN_ID];

// This random, HttpOnly cookie is an anonymous workspace capability, not a user account.
export function workspaceCookie(header:string|null):string|null {
 const value=header?.match(/(?:^|;\s*)lb_reviewer=([^;]*)(?:;|$)/)?.[1];
 return value&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)?value:null;
}
