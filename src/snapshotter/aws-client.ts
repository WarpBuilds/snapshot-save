import AWS from 'aws-sdk';

// Define the interface for the instance metadata
interface InstanceMetadata {
  instanceId: string;
}

// Define the interface for the volume information
export interface VolumeInfo {
  VolumeId: string;
}

// AWSClient class to initialize the AWS EC2 client and fetch EBS volume IDs
export class AWSClient {
  private ec2: AWS.EC2;
  private metadataService: AWS.MetadataService;

  constructor() {
    // Initialize the AWS SDK EC2 client
    this.ec2 = new AWS.EC2({ region: 'us-east-1' });
    this.metadataService = new AWS.MetadataService();
  }

  // Fetch instance metadata
  private async getInstanceMetadata(): Promise<InstanceMetadata> {
    return new Promise((resolve, reject) => {
      this.metadataService.request('/latest/meta-data/instance-id', (err, data) => {
        if (err) {
          reject(new Error('This script must be run from within an EC2 instance.'));
        } else {
          resolve({ instanceId: data });
        }
      });
    });
  }

  // Fetch EBS volumes attached to the instance
  public async getAttachedVolumes(): Promise<VolumeInfo[]> {
    const metadata = await this.getInstanceMetadata();
    const params = {
      InstanceIds: [metadata.instanceId],
    };

    try {
      const response = await this.ec2.describeInstances(params).promise();
      const volumes: VolumeInfo[] = [];

      // Extract volume IDs from the response
      response.Reservations?.forEach((reservation) => {
        reservation.Instances?.forEach((instance) => {
          instance.BlockDeviceMappings?.forEach((mapping) => {
            if (mapping.Ebs?.VolumeId) {
              volumes.push({ VolumeId: mapping.Ebs.VolumeId });
            }
          });
        });
      });

      return volumes;
    } catch (error: any) {
      throw new Error('Failed to fetch attached volumes: ' + error?.message);
    }
  }
}
