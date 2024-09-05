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
import type { CommonsRunnerImagePullSecretDockerCredentials } from './CommonsRunnerImagePullSecretDockerCredentials'
import {
  CommonsRunnerImagePullSecretDockerCredentialsFromJSON,
  CommonsRunnerImagePullSecretDockerCredentialsFromJSONTyped,
  CommonsRunnerImagePullSecretDockerCredentialsToJSON
} from './CommonsRunnerImagePullSecretDockerCredentials'
import type { CommonsRunnerImagePullSecretAWS } from './CommonsRunnerImagePullSecretAWS'
import {
  CommonsRunnerImagePullSecretAWSFromJSON,
  CommonsRunnerImagePullSecretAWSFromJSONTyped,
  CommonsRunnerImagePullSecretAWSToJSON
} from './CommonsRunnerImagePullSecretAWS'

/**
 *
 * @export
 * @interface CommonsRunnerImagePullSecret
 */
export interface CommonsRunnerImagePullSecret {
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecret
   */
  alias: string
  /**
   *
   * @type {CommonsRunnerImagePullSecretAWS}
   * @memberof CommonsRunnerImagePullSecret
   */
  aws?: CommonsRunnerImagePullSecretAWS
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecret
   */
  created_at: string
  /**
   *
   * @type {CommonsRunnerImagePullSecretDockerCredentials}
   * @memberof CommonsRunnerImagePullSecret
   */
  docker_credentials?: CommonsRunnerImagePullSecretDockerCredentials
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecret
   */
  id: string
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecret
   */
  organization_id: string
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecret
   */
  type: CommonsRunnerImagePullSecretTypeEnum
  /**
   *
   * @type {string}
   * @memberof CommonsRunnerImagePullSecret
   */
  updated_at: string
}

/**
 * @export
 */
export const CommonsRunnerImagePullSecretTypeEnum = {
  docker_credentials: 'docker_credentials',
  aws: 'aws'
} as const
export type CommonsRunnerImagePullSecretTypeEnum =
  (typeof CommonsRunnerImagePullSecretTypeEnum)[keyof typeof CommonsRunnerImagePullSecretTypeEnum]

/**
 * Check if a given object implements the CommonsRunnerImagePullSecret interface.
 */
export function instanceOfCommonsRunnerImagePullSecret(
  value: object
): value is CommonsRunnerImagePullSecret {
  if (!('alias' in value) || value['alias'] === undefined) return false
  if (!('created_at' in value) || value['created_at'] === undefined)
    return false
  if (!('id' in value) || value['id'] === undefined) return false
  if (!('organization_id' in value) || value['organization_id'] === undefined)
    return false
  if (!('type' in value) || value['type'] === undefined) return false
  if (!('updated_at' in value) || value['updated_at'] === undefined)
    return false
  return true
}

export function CommonsRunnerImagePullSecretFromJSON(
  json: any
): CommonsRunnerImagePullSecret {
  return CommonsRunnerImagePullSecretFromJSONTyped(json, false)
}

export function CommonsRunnerImagePullSecretFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): CommonsRunnerImagePullSecret {
  if (json == null) {
    return json
  }
  return {
    alias: json['alias'],
    aws:
      json['aws'] == null
        ? undefined
        : CommonsRunnerImagePullSecretAWSFromJSON(json['aws']),
    created_at: json['created_at'],
    docker_credentials:
      json['docker_credentials'] == null
        ? undefined
        : CommonsRunnerImagePullSecretDockerCredentialsFromJSON(
            json['docker_credentials']
          ),
    id: json['id'],
    organization_id: json['organization_id'],
    type: json['type'],
    updated_at: json['updated_at']
  }
}

export function CommonsRunnerImagePullSecretToJSON(
  value?: CommonsRunnerImagePullSecret | null
): any {
  if (value == null) {
    return value
  }
  return {
    alias: value['alias'],
    aws: CommonsRunnerImagePullSecretAWSToJSON(value['aws']),
    created_at: value['created_at'],
    docker_credentials: CommonsRunnerImagePullSecretDockerCredentialsToJSON(
      value['docker_credentials']
    ),
    id: value['id'],
    organization_id: value['organization_id'],
    type: value['type'],
    updated_at: value['updated_at']
  }
}
