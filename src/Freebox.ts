import _fetch from "node-fetch"

const crypto = require("crypto")
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

interface ApiResponse<T> {
  /**
   * indicates if the request was successful
   */
  readonly success: boolean

  /**
   * the result of the request.
   */
  readonly result?: T

  /**
   * In case of request error, this error_code provides information about the error.
   *
   * The possible error_code values are documented for each API.
   */
  readonly error_code?: string

  /**
   * In case of error, provides a French error message relative to the error.
   */
  readonly msg?: string
}

type SessionStart = {
  app_id: string
  app_version?: string
  password: string
}

/**
 * App token request.
 */
export type TokenRequest = {
  /**
   * ("fr.freebox.testapp" for instance)
   */
  app_id: string
  /**
   * ("Test App" for instance)
   */
  app_name: string
  /**
   * ("0.0.7" for instance)
   */
  app_version: string
  /**
   * ("Pc de Xavier" for instance)
   */
  device_name: string
}

export type TokenResult = {
  /**
   * ("dyNYgfK0Ya6FWGqq83sBHa7TwzWo+pg4fDFUJHShcjVYzTfaRrZzm93p7OTAfH/0" for instance)
   */
  app_token: string

  /**
   * (42 for instance)
   */
  track_id: number
}

enum TrackStatus {
  /**
   * The app_token is invalid or has been revoked.
   */
  unknown = "unknown",

  /**
   * The user has not confirmed the authorization request yet.
   */
  pending = "pending",

  /**
   * The user did not confirmed the authorization within the given time.
   */
  timeout = "timeout",

  /**
   * the app_token is valid and can be used to open a session
   */
  granted = "granted",

  /**
   * the user denied the authorization request
   */
  denied = "denied"
}

export type TrackResult = {

  status: TrackStatus

  challenge: string

  /**
   * @since v9
   */
  password_salt: string
}

export interface ChallengeResult {
  /**
   * (false typically).
   */
  logged_in: boolean

  /**
   * ("VzhbtpR4r8CLaJle2QgJBEkyd8JPb0zL" for instance)
   */
  challenge: string

  /**
   * @since v7
   */
  password_salt: string

  /**
   * @since v7
   */
  password_set: boolean
}

export type FreeboxSession = {
  app_id: string
  app_version: string
  session_token: string
}

export class Freebox {
  private apiVersion: ApiVersion

  constructor(readonly apiDomainAndPort: string) {
  }

  async request<T>(api_url: string, payload?: Record<string, unknown>): Promise<T> {
    const apiVersion = this.apiVersion.api_version
    const apiMajorVersion = "v" + apiVersion.substring(0, apiVersion.indexOf("."))
    const url = `${this.apiDomainAndPort}${this.apiVersion.api_base_url}${apiMajorVersion}/${api_url}`
    const body = JSON.stringify(payload)
    const bodyInit = payload ? {method: "POST", body} : {method: "GET"}
    console.debug(bodyInit.method, url)
    const response = await fetch(url, bodyInit)
    if (response.ok) {
      let apiResponse = (await response.json()) as ApiResponse<T>
      if (apiResponse.success) {
        return apiResponse.result
      } else {
        throw Error(`${apiResponse.error_code}: ${apiResponse.msg}`)
      }
    } else {
      throw Error(response.statusText)
    }
  }

  async login(tokenRequest: TokenRequest): Promise<FreeboxSession> {
    const {app_id, app_version} = tokenRequest
    const {app_token, track_id} = await this.request<TokenResult>("login/authorize", tokenRequest)
    const check = await this.request<TrackResult>(`login/authorize/${track_id}`)
    if (check.status === TrackStatus.pending) {
      const loginResponse = await this.request<ChallengeResult>("login")
      const challenge = loginResponse.challenge
      const password = crypto.createHmac("sha1", app_token).update(challenge).digest("hex")
      const sessionPayload: SessionStart = {app_id, app_version, password}
      const sessionResponse = await this.request<any>("login/session", sessionPayload)
      const session_token = sessionResponse.session_token
      return {app_id, app_version, session_token}
    }
    throw Error(check.status)
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
