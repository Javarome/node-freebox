import _fetch from "node-fetch"

declare global {
  var fetch: typeof _fetch
}

export type ApiVersion = {
  /**
   * 'Freebox v7 (r1)'
   */
  box_model_name: string
  /**
   * '/api/'
   */
  api_base_url: string,
  /**
   * 21535
   */
  https_port: number,
  /**
   * 'Freebox Server'
   */
  device_name: string,
  /**
   * true
   */
  https_available: boolean,

  /**
   * 'fbxgw7-r1/full'
   */
  box_model: string,

  /**
   * Random domain name ("n1s25qlo.fbxos.fr" for instance).
   */
  api_domain: string,
  /**
   * 'd8f5234e17a0cc08d75330dd589f1a34'
   */
  uid: string,
  /**
   * '9.0'
   */
  api_version: string,
  /**
   * 'FreeboxServer7,1'
   */
  device_type: string
}


export class Freebox {
  private apiVersion: ApiVersion

  constructor(readonly apiDomainAndPort: string) {
  }

  async request<T>(api_url: string): Promise<T> {
    const apiVersion = this.apiVersion.api_version
    const apiMajorVersion = "v" + apiVersion.substring(0, apiVersion.indexOf("."))
    const url = `${this.apiDomainAndPort}${this.apiVersion.api_base_url}${apiMajorVersion}/${api_url}`
    console.log("Querying", url)
    const response = await fetch(url)
    if (response.ok) {
      return response.json()
    } else {
      throw Error(response.statusText)
    }
  }

  async discover(): Promise<ApiVersion> {
    const response = await fetch(this.apiDomainAndPort + "/api_version")
    if (response.ok) {
      this.apiVersion = await response.json()
      return this.apiVersion
    } else {
      throw Error(response.statusText)
    }
  }
}
