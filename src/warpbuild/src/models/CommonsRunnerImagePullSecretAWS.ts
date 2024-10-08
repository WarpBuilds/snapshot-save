/* tslint:disable */
/* eslint-disable */
/**
 * Warp Builds API Docs
 * This is the docs for warp builds api for argonaut
 *
 * The version of the OpenAPI document: 0.4.0
 * Contact: support@swagger.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime'
/**
 *
 * @export
 * @interface CommonsRunnerImagePullSecretAWS
 */
export interface CommonsRunnerImagePullSecretAWS {
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecretAWS
   */
  access_key_id: string
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecretAWS
   */
  region: string
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecretAWS
   */
  secret_access_key: string
}

/**
 * Check if a given object implements the CommonsRunnerImagePullSecretAWS interface.
 */
export function instanceOfCommonsRunnerImagePullSecretAWS(
  value: object
): value is CommonsRunnerImagePullSecretAWS {
  if (!('access_key_id' in value) || value['access_key_id'] === undefined)
    return false
  if (!('region' in value) || value['region'] === undefined) return false
  if (
    !('secret_access_key' in value) ||
    value['secret_access_key'] === undefined
  )
    return false
  return true
}

export function CommonsRunnerImagePullSecretAWSFromJSON(
  json: any
): CommonsRunnerImagePullSecretAWS {
  return CommonsRunnerImagePullSecretAWSFromJSONTyped(json, false)
}

export function CommonsRunnerImagePullSecretAWSFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): CommonsRunnerImagePullSecretAWS {
  if (json == null) {
    return json
  }
  return {
    access_key_id: json['access_key_id'],
    region: json['region'],
    secret_access_key: json['secret_access_key']
  }
}

export function CommonsRunnerImagePullSecretAWSToJSON(
  value?: CommonsRunnerImagePullSecretAWS | null
): any {
  if (value == null) {
    return value
  }
  return {
    access_key_id: value['access_key_id'],
    region: value['region'],
    secret_access_key: value['secret_access_key']
  }
}
