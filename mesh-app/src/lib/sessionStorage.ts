export const setToSessionStorage = (key: string, value: any) => {
  sessionStorage.setItem(key, JSON.stringify(value))
}

export const getFromSessionStorage = (key: string) => {
  const data = sessionStorage.getItem(key)

  try {
    return JSON.parse(data)
  } catch (e) {
    return data
  }
}
