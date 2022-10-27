import {Freebox, TokenRequest} from "./Freebox"

const freebox = new Freebox("https://mafreebox.freebox.fr")

freebox.discover().then(async (versionInfo) => {
  console.log(`Discovered ${versionInfo.device_name}`)
  const response = await freebox.login({
    app_id: "fr.javarome.node-client",
    app_name: "Freebox node client test App",
    app_version: "0.0.7",
    device_name: "Pc de Xavier"
  })
  console.log(response)
})
