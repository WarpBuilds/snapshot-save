#!/bin/bash

# npm install openapi-typescript-codegen -g
# npm install @openapitools/openapi-generator-cli -g
# openapi-generator-cli version-manager set 6.0.1
# install java runtime

set -e

remove_trailing_slash() {
  local path="src/warpbuild"
  echo "${path%/}"
}

# Generate filtered swagger file
echo "Generating filtered swagger file"
# Check if redocly is installed
if ! command -v redocly &> /dev/null
then
    echo "redocly could not be found"
    echo "Visit 'https://redocly.com/docs/cli/installation' to install redocly"
    exit 1
fi

redocly bundle filter -o docs/swagger-filtered.yaml --remove-unused-components

swagger_path='docs/swagger-filtered.yaml'
echo "Checking if swagger file exists"
if [ ! -f "$swagger_path" ]; then
  echo "Swagger file does not exist"
  exit 1
fi

api_path=$(remove_trailing_slash $1)
echo "Removing existing sdk"
rm -rf $api_path
echo "Generating sdk"
latest_version=$(openapi-generator-cli version)
echo "Generating sdk using typescript-axios and schemas"
openapi-generator-cli generate -i $swagger_path \
  -g typescript-axios \
  -o $api_path \
  --additional-properties=supportsES6=true \
  --additional-properties=typescriptThreePlus=true \
  --additional-properties=useSingleRequestParameter=true \
  --additional-properties=withSeparateModelsAndApi=true,modelPackage=models,apiPackage=api,npmName=@argonautdev/warpbuild-js-sdk,npmVersion=$1,legacyDiscriminatorBehavior=false,disallowAdditionalPropertiesIfNotPresent=false \
  --enable-post-process-file \
  --skip-validate-spec

echo "Removing existing 'schemas' directory"
rm -rf $api_path/schemas
echo "Removed existing 'schemas' directory"

rmdir $api_path/typescript-fetch
rm $api_path/package.json
rm $api_path/tsconfig.json
rm $api_path/git_push.sh
rm $api_path/README.md
rm $api_path/.gitignore
rm $api_path/.npmignore

declare -a modules=("runner-images-api", "runner-image-versions-api")

# chmod +x third_party/api-rm-unused.py
# ./third_party/api-rm-unused.py $api_path
