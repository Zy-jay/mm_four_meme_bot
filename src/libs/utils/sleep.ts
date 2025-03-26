export const sleep = async (ms: number, msg?: any) => {
  msg && console.log(msg !== true ? msg : "Timout " + ms / 1000 + " sec...")
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
