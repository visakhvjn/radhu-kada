#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RadhuStack } from './radhu-stack'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: resolve(root, '.env.local') })
config({ path: resolve(root, '.env') })

const app = new cdk.App()
new RadhuStack(app, 'RadhuStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-south-1',
  },
})
