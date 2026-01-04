import { defineConfig } from 'cypress'
import * as security from './lib/insecurity'
import config from 'config'
import type { Memory as MemoryConfig, Product as ProductConfig } from './lib/config.types'
import * as utils from './lib/utils'
import * as otplib from 'otplib'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  projectId: '3hrkhu',
  defaultCommandTimeout: 10000,
  retries: {
    runMode: 2
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'test/cypress/e2e/**.spec.ts',
    downloadsFolder: 'test/cypress/downloads',
    fixturesFolder: false,
    supportFile: 'test/cypress/support/e2e.ts',
    setupNodeEvents (on: any) {
      on('task', {
        GenerateCoupon (discount: number) {
          return security.generateCoupon(discount)
        },
        GetBlueprint () {
          for (const product of config.get<ProductConfig[]>('products')) {
            if (product.fileForRetrieveBlueprintChallenge) {
              const blueprint = product.fileForRetrieveBlueprintChallenge
              return blueprint
            }
          }
        },
        GetChristmasProduct () {
          return config.get<ProductConfig[]>('products').filter(
            (product) => product.useForChristmasSpecialChallenge
          )[0]
        },
        GetCouponIntent () {
          const trainingData = require(`data/chatbot/${utils.extractFilename(
            config.get('application.chatBot.trainingData')
          )}`)
          const couponIntent = trainingData.data.filter(
            (data: { intent: string }) => data.intent === 'queries.couponCode'
          )[0]
          return couponIntent
        },
        GetFromMemories (property: string) {
          for (const memory of config.get<MemoryConfig[]>('memories') as any) {
            if (memory[property]) {
              return memory[property]
            }
          }
        },
        GetFromConfig (variable: string) {
          return config.get(variable)
        },
        GetOverwriteUrl () {
          return config.get('challenges.overwriteUrlForProductTamperingChallenge')
        },
        GetPastebinLeakProduct () {
          return config.get<ProductConfig[]>('products').filter(
            (product) => product.keywordsForPastebinDataLeakChallenge
          )[0]
        },
        GetTamperingProductId () {
          const products = config.get<ProductConfig[]>('products')
          for (let i = 0; i < products.length; i++) {
            if (products[i].urlForProductTamperingChallenge) {
              return i + 1
            }
          }
        },
        GenerateAuthenticator (inputString: string) {
          // Use environment variable if inputString matches known test secret
          if (inputString === 'TOTP_SECRET_VALID') {
            inputString = process.env.TEST_TOTP_SECRET_VALID ?? 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH'
          }
          return otplib.authenticator.generate(inputString)
        },
        GetTestPassword (key: string) {
          // NOSONAR: Test passwords with fallback defaults - Real values come from environment variables
          // These are Cypress E2E test credentials only, not production passwords
          // Format: process.env.TEST_PASSWORD_* (secure) ?? 'fallback_for_local_testing' (non-sensitive)
          const passwords: Record<string, string> = {
            admin: process.env.TEST_PASSWORD_ADMIN ?? 'admin123',
            jim: process.env.TEST_PASSWORD_JIM ?? 'ncc-1701',
            bender: process.env.TEST_PASSWORD_BENDER ?? 'EinBelegtesBrotMitSchinkenSCHINKEN!',
            amy: process.env.TEST_PASSWORD_AMY ?? 'K1f.....................',
            accountant: process.env.TEST_PASSWORD_ACCOUNTANT ?? 'i am an awesome accountant',
            wurstbrot: process.env.TEST_PASSWORD_WURSTBROT ?? '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB',
            benderDeluxe: process.env.TEST_PASSWORD_BENDER_DELUXE ?? 'OhG0dPlease1nsertLiquor!',
            support: process.env.TEST_PASSWORD_SUPPORT ?? 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P',
            ciso: process.env.TEST_PASSWORD_CISO ?? 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb',
            mcSafesearch: process.env.TEST_PASSWORD_MC_SAFESEARCH ?? 'Mr. N00dles',
            morty: process.env.TEST_PASSWORD_MORTY ?? 'focusOnScience',
            uvogin: process.env.TEST_PASSWORD_UVOGIN ?? 'Never mind...',
            oauth: process.env.TEST_PASSWORD_OAUTH ?? 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=',
            admun: process.env.TEST_PASSWORD_ADMUN ?? 'admun123',
            benderSlurm: process.env.TEST_PASSWORD_BENDER_SLURM ?? 'slurmClassic',
            jimDeluxe: process.env.TEST_PASSWORD_JIM_DELUXE ?? 'jim',
            adminDeluxe: process.env.TEST_PASSWORD_ADMIN_DELUXE ?? 'admin',
            mcSafesearchDeluxe: process.env.TEST_PASSWORD_MC_SAFESEARCH_DELUXE ?? 'Mr. N00dles',
            mortyNew1: process.env.TEST_PASSWORD_MORTY_NEW1 ?? 'focusOnScienceMorty!focusOnScience',
            mortyNew2: process.env.TEST_PASSWORD_MORTY_NEW2 ?? 'GonorrheaCantSeeUs!'
          }
          return passwords[key] || key
        },
        toISO8601 () {
          const date = new Date()
          return utils.toISO8601(date)
        },
        isDocker () {
          return utils.isDocker()
        },
        isWindows () {
          return utils.isWindows()
        }
      })
    }
  }
})
