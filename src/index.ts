import {Freebox} from "./Freebox"

const freebox = new Freebox("https://mafreebox.freebox.fr")
freebox.discover().then(async (versionInfo) => {
  console.log(`Discovered ${versionInfo.device_name}`)
  const response = await freebox.request("login")
  console.log(response)
})
