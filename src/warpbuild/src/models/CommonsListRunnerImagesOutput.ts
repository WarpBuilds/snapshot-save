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
import type { CommonsRunnerImage } from './CommonsRunnerImage'
import {
  CommonsRunnerImageFromJSON,
  CommonsRunnerImageFromJSONTyped,
  CommonsRunnerImageToJSON
} from './CommonsRunnerImage'

/**
 *
 * @export
 * @interface CommonsListRunnerImagesOutput
 */
export interface CommonsListRunnerImagesOutput {
  /**
   *
   * @type {Array<CommonsRunnerImage>}
   * @memberof CommonsListRunnerImagesOutput
   */
  runner_images: Array<CommonsRunnerImage>
}

/**
 * Check if a given object implements the CommonsListRunnerImagesOutput interface.
 */
export function instanceOfCommonsListRunnerImagesOutput(
  value: object
): value is CommonsListRunnerImagesOutput {
  if (!('runner_images' in value) || value['runner_images'] === undefined)
    return false
  return true
}

export function CommonsListRunnerImagesOutputFromJSON(
  json: any
): CommonsListRunnerImagesOutput {
  return CommonsListRunnerImagesOutputFromJSONTyped(json, false)
}

export function CommonsListRunnerImagesOutputFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): CommonsListRunnerImagesOutput {
  if (json == null) {
    return json
  }
  return {
    runner_images: (json['runner_images'] as Array<any>).map(
      CommonsRunnerImageFromJSON
    )
  }
}

export function CommonsListRunnerImagesOutputToJSON(
  value?: CommonsListRunnerImagesOutput | null
): any {
  if (value == null) {
    return value
  }
  return {
    runner_images: (value['runner_images'] as Array<any>).map(
      CommonsRunnerImageToJSON
    )
  }
}