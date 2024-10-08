import {
  Configuration,
  ConfigurationParameters,
  V1RunnerImagesApi,
  V1RunnerImageVersionsApi
} from '../warpbuild/src'
import { Logger } from './logger'

export type WarpbuildOptions = {
  token: string
  baseURL: string
  logger: Logger
}

export class Warpbuild {
  private token: string
  private logger: Logger
  private baseURL: string
  private configuration: Configuration
  v1RunnerImagesAPI: V1RunnerImagesApi
  v1RunnerImagesVersionsAPI: V1RunnerImageVersionsApi

  constructor(opt: WarpbuildOptions) {
    this.logger = opt.logger
    this.token = opt.token
    this.baseURL = opt.baseURL
    const cp: ConfigurationParameters = {
      accessToken: this.token
    }
    if (this.baseURL !== '') {
      cp.basePath = this.baseURL
    }
    this.configuration = new Configuration(cp)
    this.v1RunnerImagesAPI = new V1RunnerImagesApi(this.configuration)
    //
    this.v1RunnerImagesVersionsAPI = new V1RunnerImageVersionsApi(
      this.configuration
    )
  }
}
