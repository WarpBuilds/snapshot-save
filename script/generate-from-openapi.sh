#!/bin/bash
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
echo "Generating sdk using typescript-fetch and schemas"

openapi-generator-cli generate -i $swagger_path \
  -g typescript-fetch \
  -o $api_path \
  --additional-properties=supportsES6=true \
  --additional-properties=paramNaming=snake_case \
  --additional-properties=enumPropertyNaming=snake_case \
  --additional-properties=modelPropertyNaming=snake_case \
  --additional-properties=typescriptThreePlus=true \
  --additional-properties=useSingleRequestParameter=true \
  --additional-properties=withSeparateModelsAndApi=true,modelPackage=model,apiPackage=api,npmName=@argonautdev/warpbuild-js-sdk,npmVersion=$1,legacyDiscriminatorBehavior=false,disallowAdditionalPropertiesIfNotPresent=false \
  --enable-post-process-file \
  --skip-validate-spec

echo "Removing existing 'schemas' directory"
rm -rf $api_path/schemas
echo "Removed existing 'schemas' directory"

rmdir $api_path/typescript-fetch || true
rm $api_path/package.json || true
rm $api_path/tsconfig.json || true
rm $api_path/git_push.sh || true
rm $api_path/README.md || true
rm $api_path/.gitignore || true
rm $api_path/.npmignore || true

