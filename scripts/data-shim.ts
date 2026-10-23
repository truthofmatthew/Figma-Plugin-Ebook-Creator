// Dev only: in-memory plugin data for environments where setPluginData is unavailable.
const store = new Map<string, string>();
export const getData = (n: BaseNode, key: string) => store.get(`${n.id}|${key}`) ?? '';
export const setData = (n: BaseNode, key: string, value: string) => void store.set(`${n.id}|${key}`, value);
