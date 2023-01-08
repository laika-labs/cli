const axios = require('axios')
const { exec } = require('child_process')
const { resolve } = require('path')
const TJS = require('typescript-json-schema')

const { capitalize } = require('../utils/string')
const { API } = require('../config')

module.exports = async function sync(contractName: string) {
  const { error } = await exec(`beaker wasm ts-gen ${contractName}`)

  if (error) {
    return
  }

  const settings = {}

  const compilerOptions = {}

  const program = TJS.getProgramFromFiles(
    [resolve(`ts/sdk/types/contracts/${capitalize(contractName)}.types.d.ts`)],
    compilerOptions,
    './ts/sdk/types/contracts/'
  )
  const generator = TJS.buildGenerator(program, settings)

  let executeMsg = generator.getSchemaForSymbol('ExecuteMsg')
  let queryMsg = generator.getSchemaForSymbol('QueryMsg')

  if (
    (!queryMsg.anyOf && !queryMsg.oneOf && !queryMsg.allOf) ||
    (!executeMsg.anyOf && !executeMsg.oneOf && !executeMsg.allOf)
  ) {
    if (!queryMsg.anyOf && !queryMsg.oneOf && !queryMsg.allOf) {
      queryMsg = {
        ...queryMsg,
        oneOf: [
          {
            additionalProperties: false,
            properties: queryMsg.properties,
            type: queryMsg.type,
          },
        ],
      }
    } else {
      executeMsg = {
        ...executeMsg,
        oneOf: [
          {
            additionalProperties: false,
            properties: executeMsg.properties,
            type: executeMsg.type,
          },
        ],
      }
    }
  } else {
    queryMsg = {
      ...queryMsg,
      oneOf: [
        {
          additionalProperties: false,
          properties: queryMsg.properties,
          type: queryMsg.type,
        },
      ],
    }
    executeMsg = {
      ...executeMsg,
      oneOf: [
        {
          additionalProperties: false,
          properties: executeMsg.properties,
          type: executeMsg.type,
        },
      ],
    }
  }

  try {
    console.log(`Syncing the ABI of contract...`)

    const response = await axios.post(`${API}/msg-storages/`, {
      msg: { executeMsg, queryMsg },
    })
    const publicUrl = await response

    console.log(`Check out your request at ${publicUrl.data}`)
  } catch (e) {
    console.log(e)
  }
}
