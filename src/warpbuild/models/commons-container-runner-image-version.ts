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



/**
 * 
 * @export
 * @interface CommonsContainerRunnerImageVersion
 */
export interface CommonsContainerRunnerImageVersion {
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'data_dir_size'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'image_digest'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'image_repository'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'image_size'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'image_tag'?: string;
    /**
     * ImageURI is the full uri of the image. This can be used to download the image  +OutputOnly
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'image_uri'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'snapshot_id'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'snapshot_size'?: string;
    /**
     * 
     * @type {string}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'volume_id'?: string;
    /**
     * VolumeSizeGB is the size of the volume in GB. This is used when creating a snapshot out of the volume.  This is rounded up to the nearest GiB.
     * @type {number}
     * @memberof CommonsContainerRunnerImageVersion
     */
    'volume_size_gb'?: number;
}

