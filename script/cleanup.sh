#!/bin/bash

set -e

# Remove /var/lib/warpbuild-agentd/settings.json
sudo rm /var/lib/warpbuild-agentd/settings.json

echo "Cleanup complete"