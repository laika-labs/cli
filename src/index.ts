#!/usr/bin/env node
const { Command } = require('commander')

const sync = require('./commands/sync')

const program = new Command()

program
  .name('laika cli')
  .description('Show the Laika version information')
  .version(`laika version ${require('../package.json').version}`)

program
  .command('beaker')
  .command('sync')
  .argument('<contract-name>', 'contract name')
  .action(sync)

program.parse(process.argv)
