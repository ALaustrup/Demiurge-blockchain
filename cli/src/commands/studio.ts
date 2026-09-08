/**
 * Demiurge Studio commands — local project management
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import {
  createProject,
  getActiveProject,
  listProjects,
  setActiveProject,
} from '../lib/studio-projects';

export function registerStudioCommands(program: Command) {
  const studio = program
    .command('studio')
    .description('Demiurge Studio — local game projects');

  const project = studio.command('project').description('Manage Studio game projects');

  project
    .command('list')
    .alias('ls')
    .description('List all projects')
    .option('--json', 'Output as JSON')
    .action((options) => {
      const projects = listProjects();
      if (options.json) {
        console.log(JSON.stringify(projects, null, 2));
        return;
      }
      if (projects.length === 0) {
        console.log(chalk.yellow('No projects yet. Run: demiurge studio project new "My Game"'));
        return;
      }
      const table = new Table({
        head: ['Active', 'Slug', 'Name', 'Version'],
        style: { head: ['cyan'] },
      });
      for (const p of projects) {
        table.push([
          p.isActive ? chalk.green('●') : '',
          p.slug,
          p.displayName,
          p.version,
        ]);
      }
      console.log(table.toString());
      const active = getActiveProject();
      if (active) {
        console.log(chalk.gray(`\nChain data: ${active.chainDataDir}`));
        console.log(chalk.gray('Restart demiurge-node after switching projects.'));
      }
    });

  project
    .command('new <name>')
    .description('Create a new project and set it active')
    .action((name: string) => {
      const spinner = ora(`Creating project "${name}"...`).start();
      try {
        const p = createProject(name);
        spinner.succeed(`Created ${chalk.cyan(p.slug)}`);
        console.log(chalk.gray(`  Path:  ${p.path}`));
        console.log(chalk.gray(`  Chain: ${p.chainDataDir}`));
        console.log(chalk.yellow('\n  Restart demiurge-node to use this project chain.'));
      } catch (e) {
        spinner.fail((e as Error).message);
        process.exit(1);
      }
    });

  project
    .command('use <slug>')
    .description('Set the active project')
    .action((slug: string) => {
      try {
        const meta = setActiveProject(slug);
        console.log(chalk.green(`Active project: ${meta.displayName}`));
        console.log(chalk.gray(`Chain data: ${meta.chainDataDir}`));
        console.log(chalk.yellow('Restart demiurge-node to load this chain.'));
      } catch (e) {
        console.error(chalk.red((e as Error).message));
        process.exit(1);
      }
    });

  project
    .command('active')
    .description('Show the active project')
    .action(() => {
      const active = getActiveProject();
      if (!active) {
        console.log(chalk.yellow('No active project.'));
        console.log(chalk.gray('Create one: demiurge studio project new "My Game"'));
        return;
      }
      console.log(chalk.cyan.bold(active.displayName));
      console.log(`  Slug:  ${active.slug}`);
      console.log(`  Path:  ${active.path}`);
      console.log(`  Chain: ${active.chainDataDir}`);
      console.log(`  Since: ${active.activatedAt}`);
    });

  studio
    .command('start')
    .description('Print instructions to start the full Studio stack')
    .action(() => {
      console.log(chalk.cyan.bold('\nDemiurge Studio stack\n'));
      console.log('From the repo root:\n');
      console.log(chalk.white('  npm run studio:start\n'));
      console.log('Or step by step:\n');
      console.log(chalk.gray('  npm run studio:infra'));
      console.log(chalk.gray('  npm run studio:node'));
      console.log(chalk.gray('  npm run studio:auth'));
      console.log(chalk.gray('  npm run studio:hub'));
      console.log('\nHub: http://localhost:3000/studio/projects\n');
    });
}
