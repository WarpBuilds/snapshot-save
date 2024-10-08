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
 * @interface CommonsWarpbuildImage
 */
export interface CommonsWarpbuildImage {
  /**
   *
   * @type {string}
   * @memberof CommonsWarpbuildImage
   */
  cloud_init_template?: string
  /**
   *
   * @type {string}
   * @memberof CommonsWarpbuildImage
   */
  image_uri?: string
}

/**
 * Check if a given object implements the CommonsWarpbuildImage interface.
 */
export function instanceOfCommonsWarpbuildImage(
  value: object
): value is CommonsWarpbuildImage {
  return true
}

export function CommonsWarpbuildImageFromJSON(
  json: any
): CommonsWarpbuildImage {
  return CommonsWarpbuildImageFromJSONTyped(json, false)
}

export function CommonsWarpbuildImageFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): CommonsWarpbuildImage {
  if (json == null) {
    return json
  }
  return {
    cloud_init_template:
      json['cloud_init_template'] == null
        ? undefined
        : json['cloud_init_template'],
    image_uri: json['image_uri'] == null ? undefined : json['image_uri']
  }
}

export function CommonsWarpbuildImageToJSON(
  value?: CommonsWarpbuildImage | null
): any {
  if (value == null) {
    return value
  }
  return {
    cloud_init_template: value['cloud_init_template'],
    image_uri: value['image_uri']
  }
}
