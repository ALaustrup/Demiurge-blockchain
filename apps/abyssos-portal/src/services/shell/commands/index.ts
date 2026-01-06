/**
 * AbyssOS Shell Command Router
 * 
 * Modular command system for the AbyssOS terminal
 */

import { abyssIdSDK } from '../../../services/abyssid/sdk';
import { sendCgt, deriveDemiurgePublicKey } from '../../../services/wallet/demiurgeWallet';
import { processManager } from '../../system/processManager';
import { peerDiscovery } from '../../grid/discovery';
import { getAllVMJobs } from '../../abyssvm/abyssvm';

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface CommandHandler {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

export interface CommandContext {
  session: { username: string; publicKey: string } | null;
  getBalance: () => Promise<number>;
  getBlockHeight: () => number;
  getConnectionStatus: () => 'connected' | 'polling' | 'disconnected';
}

/**
 * Help command
 */
export const helpCommand: CommandHandler = {
  name: 'help',
  description: 'Show available commands',
  usage: 'help [command]',
  execute: async (args) => {
    const commands = getAllCommands();
    
    if (args.length === 0) {
      const output = commands.map(cmd => 
        `  ${cmd.name.padEnd(20)} ${cmd.description}`
      ).join('\n');
      return {
        success: true,
        output: `Available commands:\n\n${output}\n\nUse 'help <command>' for usage details.`,
      };
    }
    
    const cmd = commands.find(c => c.name === args[0]);
    if (!cmd) {
      return {
        success: false,
        output: '',
        error: `Command '${args[0]}' not found. Use 'help' to see all commands.`,
      };
    }
    
    return {
      success: true,
      output: `${cmd.name}\n\n${cmd.description}\n\nUsage: ${cmd.usage}`,
    };
  },
};

/**
 * Wallet balance command
 */
export const walletBalanceCommand: CommandHandler = {
  name: 'wallet.balance',
  description: 'Show CGT balance',
  usage: 'wallet.balance',
  execute: async (_args, context) => {
    if (!context.session) {
      return {
        success: false,
        output: '',
        error: 'Not logged in. Please log in with AbyssID.',
      };
    }
    
    try {
      const balance = await context.getBalance();
      const publicKey = await deriveDemiurgePublicKey(context.session.publicKey);
      
      return {
        success: true,
        output: `CGT Balance: ${typeof balance === 'number' ? balance.toFixed(8) : String(balance)} CGT\nAddress: ${publicKey.slice(0, 16)}...`,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Failed to get balance',
      };
    }
  },
};

/**
 * Wallet send command
 */
export const walletSendCommand: CommandHandler = {
  name: 'wallet.send',
  description: 'Send CGT to an address',
  usage: 'wallet.send <address> <amount>',
  execute: async (args, context) => {
    if (!context.session) {
      return {
        success: false,
        output: '',
        error: 'Not logged in. Please log in with AbyssID.',
      };
    }
    
    if (args.length < 2) {
      return {
        success: false,
        output: '',
        error: 'Usage: wallet.send <address> <amount>',
      };
    }
    
    const [to, amountStr] = args;
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        output: '',
        error: 'Invalid amount',
      };
    }
    
    try {
      const result = await sendCgt({
        from: context.session.publicKey,
        to,
        amount,
      });
      
      return {
        success: true,
        output: `Transaction sent!\nHash: ${result.txHash}\nAmount: ${amount} CGT\nTo: ${to.slice(0, 16)}...`,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Failed to send transaction',
      };
    }
  },
};

/**
 * DRC-369 list command
 */
export const drc369ListCommand: CommandHandler = {
  name: 'drc369.list',
  description: 'List owned DRC-369 assets',
  usage: 'drc369.list',
  execute: async (_args, context) => {
    if (!context.session) {
      return {
        success: false,
        output: '',
        error: 'Not logged in. Please log in with AbyssID.',
      };
    }
    
    try {
      const assets = await abyssIdSDK.drc369.getOwned({ owner: context.session.publicKey });
      
      if (assets.length === 0) {
        return {
          success: true,
          output: 'No DRC-369 assets found.',
        };
      }
      
      const output = assets.map((asset, i) => 
        `${i + 1}. ${asset.name || 'Untitled'}\n   ID: ${asset.id.slice(0, 16)}...\n   Chain: ${asset.chain}\n   ${asset.onChain ? '✓ On-chain' : 'Local'}`
      ).join('\n\n');
      
      return {
        success: true,
        output: `Found ${assets.length} asset(s):\n\n${output}`,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Failed to list assets',
      };
    }
  },
};

/**
 * Chain info command
 */
export const chainInfoCommand: CommandHandler = {
  name: 'chain.info',
  description: 'Show chain information',
  usage: 'chain.info',
  execute: async (_args, context) => {
    const height = context.getBlockHeight();
    const status = context.getConnectionStatus();
    
    return {
      success: true,
      output: `Demiurge Chain\n\nBlock Height: ${height}\nConnection: ${status}\nRPC: ${import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc'}`,
    };
  },
};

/**
 * System process list command
 */
export const systemPsCommand: CommandHandler = {
  name: 'system.ps',
  description: 'List running processes',
  usage: 'system.ps',
  execute: async (_args) => {
    const processes = processManager.list();
    
    if (processes.length === 0) {
      return {
        success: true,
        output: 'No processes running.',
      };
    }
    
    const output = processes.map(p => 
      `${p.pid.toString().padStart(4)} ${p.name.padEnd(20)} ${p.type.padEnd(10)} ${p.status.padEnd(10)} ${p.cpuUsage.toFixed(1)}% ${(p.memoryUsage / 1024 / 1024).toFixed(2)}MB`
    ).join('\n');
    
    return {
      success: true,
      output: `PID  NAME                 TYPE       STATUS     CPU    MEM\n${output}\n\nUse system.kill <pid> to stop a process.`,
    };
  },
};

/**
 * System kill command
 */
export const systemKillCommand: CommandHandler = {
  name: 'system.kill',
  description: 'Kill a process by PID',
  usage: 'system.kill <pid>',
  execute: async (args) => {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'Usage: system.kill <pid>',
      };
    }
    
    const pid = parseInt(args[0]);
    if (isNaN(pid)) {
      return {
        success: false,
        output: '',
        error: 'Invalid PID',
      };
    }
    
    const killed = processManager.kill(pid);
    if (!killed) {
      return {
        success: false,
        output: '',
        error: `Process ${pid} not found or already stopped.`,
      };
    }
    
    return {
      success: true,
      output: `Process ${pid} killed.`,
    };
  },
};

/**
 * Grid peers command
 */
export const gridPeersCommand: CommandHandler = {
  name: 'grid.peers',
  description: 'List connected grid peers',
  usage: 'grid.peers',
  execute: async (_args) => {
    const peers = peerDiscovery.getPeers();
    
    if (peers.length === 0) {
      return {
        success: true,
        output: 'No peers connected.',
      };
    }
    
    const output = peers.map(p => 
      `${p.peerId.slice(0, 16)}... ${p.computeScore}/100 ${(p.freeMemory / 1024 / 1024).toFixed(0)}MB ${p.connectionStatus}`
    ).join('\n');
    
    return {
      success: true,
      output: `Connected peers (${peers.length}):\n\n${output}`,
    };
  },
};

/**
 * Grid info command
 */
export const gridInfoCommand: CommandHandler = {
  name: 'grid.info',
  description: 'Show grid information',
  usage: 'grid.info',
  execute: async (_args) => {
    const peers = peerDiscovery.getPeers();
    const jobs = getAllVMJobs();
    const activeJobs = jobs.filter(j => j.status === 'running');
    const totalCompute = peers.reduce((sum, p) => sum + p.computeScore, 0);
    
    return {
      success: true,
      output: `Abyss Grid\n\nPeers: ${peers.length}\nActive Jobs: ${activeJobs.length}\nTotal Compute: ${totalCompute}\nSupported Features: wasm, sign, drc369, storage`,
    };
  },
};

/**
 * Grid run command
 */
export const gridRunCommand: CommandHandler = {
  name: 'grid.run',
  description: 'Run a WASM package on the grid',
  usage: 'grid.run <packageId>',
  execute: async (args) => {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'Usage: grid.run <packageId>',
      };
    }
    
    const packageId = args[0];
    
    return {
      success: true,
      output: `Job submitted: ${packageId}\nUse grid.info to check status.`,
    };
  },
};

/**
 * Get all registered commands
 */
/**
 * Grid stake command
 */
export const gridStakeCommand: CommandHandler = {
  name: 'grid.stake',
  description: 'Stake CGT for compute provider',
  usage: 'grid.stake <amount>',
  execute: async (args) => {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'Usage: grid.stake <amount>',
      };
    }
    
    const amount = parseFloat(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        output: '',
        error: 'Invalid amount',
      };
    }
    
    // In production, call backend API
    return {
      success: true,
      output: `Staked ${amount} CGT for compute provider.\nUse grid.providers to check status.`,
    };
  },
};

/**
 * Grid providers command
 */
export const gridProvidersCommand: CommandHandler = {
  name: 'grid.providers',
  description: 'List compute providers with stake and reputation',
  usage: 'grid.providers',
  execute: async (_args) => {
    // In production, fetch from backend
    return {
      success: true,
      output: 'Compute Providers:\n\npeer:abc123... Stake: 1000 CGT Trust: 95/100\npeer:def456... Stake: 500 CGT Trust: 88/100\n\nUse grid.stake <amount> to become a provider.',
    };
  },
};

/**
 * Spirit create command
 */
export const spiritCreateCommand: CommandHandler = {
  name: 'spirit.create',
  description: 'Create a new Abyss Spirit',
  usage: 'spirit.create <name> [template]',
  execute: async (args) => {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'Usage: spirit.create <name> [template]',
      };
    }
    
    const name = args[0];
    const template = args[1] || 'assistant';
    
    // In production, call spiritManager
    return {
      success: true,
      output: `Spirit "${name}" created with ${template} personality.\nUse spirit.run <name> <task> to assign tasks.`,
    };
  },
};

/**
 * Spirit run command
 */
export const spiritRunCommand: CommandHandler = {
  name: 'spirit.run',
  description: 'Run a task with a spirit',
  usage: 'spirit.run <name> <task>',
  execute: async (args) => {
    if (args.length < 2) {
      return {
        success: false,
        output: '',
        error: 'Usage: spirit.run <name> <task>',
      };
    }
    
    const name = args[0];
    const task = args.slice(1).join(' ');
    
    // In production, call spiritManager.addTask
    return {
      success: true,
      output: `Task assigned to ${name}: ${task}\nUse spirit.list to see all spirits.`,
    };
  },
};

export function getAllCommands(): CommandHandler[] {
  return [
    helpCommand,
    walletBalanceCommand,
    walletSendCommand,
    drc369ListCommand,
    chainInfoCommand,
    systemPsCommand,
    systemKillCommand,
    gridPeersCommand,
    gridInfoCommand,
    gridRunCommand,
    gridStakeCommand,
    gridProvidersCommand,
    spiritCreateCommand,
    spiritRunCommand,
  ];
}

/**
 * Find command by name
 */
export function findCommand(name: string): CommandHandler | undefined {
  return getAllCommands().find(cmd => cmd.name === name);
}

/**
 * Execute a command
 */
export async function executeCommand(
  input: string,
  context: CommandContext
): Promise<CommandResult> {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 0) {
    return {
      success: false,
      output: '',
      error: 'Empty command',
    };
  }
  
  const [commandName, ...args] = parts;
  const command = findCommand(commandName);
  
  if (!command) {
    return {
      success: false,
      output: '',
      error: `Command '${commandName}' not found. Use 'help' to see all commands.`,
    };
  }
  
  try {
    return await command.execute(args, context);
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message || 'Command execution failed',
    };
  }
}

