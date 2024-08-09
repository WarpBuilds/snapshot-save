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
 * @interface CommonsRunnerImageHook
 */
export interface CommonsRunnerImageHook {
  /**
   * File is the base64 encoded file.
   * This must be a shell script which is encoded in base64.
   * @type {string}
   * @memberof CommonsRunnerImageHook
   */
  file?: string
  /**
   * Type is the type of hook.
   * @type {string}
   * @memberof CommonsRunnerImageHook
   */
  type?: CommonsRunnerImageHookTypeEnum
}

/**
 * @export
 */
export const CommonsRunnerImageHookTypeEnum = {
  prehook: 'github_prehook',
  posthook: 'github_posthook'
} as const
export type CommonsRunnerImageHookTypeEnum =
  (typeof CommonsRunnerImageHookTypeEnum)[keyof typeof CommonsRunnerImageHookTypeEnum]

/**
 * Check if a given object implements the CommonsRunnerImageHook interface.
 */
export function instanceOfCommonsRunnerImageHook(
  value: object
): value is CommonsRunnerImageHook {
  return true
}

export function CommonsRunnerImageHookFromJSON(
  json: any
): CommonsRunnerImageHook {
  return CommonsRunnerImageHookFromJSONTyped(json, false)
}

export function CommonsRunnerImageHookFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): CommonsRunnerImageHook {
  if (json == null) {
    return json
  }
  return {
    file: json['file'] == null ? undefined : json['file'],
    type: json['type'] == null ? undefined : json['type']
  }
}

export function CommonsRunnerImageHookToJSON(
  value?: CommonsRunnerImageHook | null
): any {
  if (value == null) {
    return value
  }
  return {
    file: value['file'],
    type: value['type']
  }
}