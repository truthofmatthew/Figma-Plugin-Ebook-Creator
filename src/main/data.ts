// Plugin data access in one place (the dev test harness swaps this module out).
export const getData = (n: BaseNode, key: string) => n.getPluginData(key);
export const setData = (n: BaseNode, key: string, value: string) => n.setPluginData(key, value);
