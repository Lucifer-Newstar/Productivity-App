/** Pure contracts and strict allowlists for Kaizen's opt-in GitHub release update channel. */
export const UPDATE_REPOSITORY="Lucifer-Newstar/Productivity-App";
export const UPDATE_CHANNEL=process.env.NEXT_PUBLIC_KAIZEN_UPDATE_CHANNEL??"disabled";
export const CURRENT_APP_VERSION=process.env.NEXT_PUBLIC_KAIZEN_VERSION??"1.0.0";
export interface UpdateStatus {currentVersion:string;latestVersion:string;updateAvailable:boolean;downloadPath?:string;releaseUrl?:string;publishedAt?:string}
export function parseVersion(value:string):[number,number,number]|null{const match=/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);return match?[Number(match[1]),Number(match[2]),Number(match[3])]:null}
export function compareVersions(left:string,right:string):number{const a=parseVersion(left),b=parseVersion(right);if(!a||!b)throw new Error("invalid semantic version");for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]-b[i]}return 0}
export function setupAssetName(version:string){if(!parseVersion(version))throw new Error("invalid semantic version");return`Kaizen-${version.replace(/^v/,"")}-win-x64-setup.exe`}
export function releaseUrl(version:string){const clean=version.replace(/^v/,"");if(!parseVersion(clean))throw new Error("invalid semantic version");return`https://github.com/${UPDATE_REPOSITORY}/releases/tag/v${clean}`}
export function releaseDownloadUrl(version:string){const clean=version.replace(/^v/,"");return`https://github.com/${UPDATE_REPOSITORY}/releases/download/v${clean}/${setupAssetName(clean)}`}
export function safeNotificationHref(value:string|undefined):string|undefined{if(!value)return undefined;if(value.startsWith("/")&&!value.startsWith("//"))return value;return undefined}
