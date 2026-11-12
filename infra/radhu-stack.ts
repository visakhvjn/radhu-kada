import * as cdk from 'aws-cdk-lib'
import { CfnOutput, Duration } from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'

export class RadhuStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI must be set when deploying')
    }

    const fn = new NodejsFunction(this, 'Api', {
      entry: 'src/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(15),
      memorySize: 256,
      environment: {
        MONGODB_URI: mongoUri,
        MONGODB_DB_NAME: process.env.MONGODB_DB_NAME ?? 'radhu',
        APP_TIMEZONE: process.env.APP_TIMEZONE ?? 'Asia/Kolkata',
      },
      bundling: {
        format: OutputFormat.ESM,
        target: 'node22',
        mainFields: ['module', 'main'],
        banner:
          "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
        nodeModules: ['mongodb'],
      },
    })

    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [
          lambda.HttpMethod.GET,
          lambda.HttpMethod.POST,
          lambda.HttpMethod.DELETE,
        ],
        allowedHeaders: [
          'content-type',
          'mcp-session-id',
          'last-event-id',
          'mcp-protocol-version',
        ],
        exposedHeaders: ['mcp-session-id', 'mcp-protocol-version'],
      },
    })

    new CfnOutput(this, 'ApiUrl', {
      value: fnUrl.url,
    })
    new CfnOutput(this, 'McpUrl', {
      value: `${fnUrl.url}mcp`,
      description: 'Streamable HTTP MCP endpoint',
    })
  }
}
