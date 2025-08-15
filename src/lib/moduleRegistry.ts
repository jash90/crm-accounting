/**
 * Module Registry for module discovery and API registration
 * Enables modules to expose APIs and discover each other
 */

import { eventBus } from './eventBus';

export interface ModuleAPI {
  [key: string]: (...args: unknown[]) => unknown | Promise<unknown>;
}

export interface ModuleCapabilities {
  name: string;
  version: string;
  description?: string;
  api?: ModuleAPI;
  events?: string[];
  hooks?: string[];
  dependencies?: {
    required?: string[];
    optional?: string[];
  };
  provides?: {
    entities?: string[];
    features?: string[];
  };
}

class ModuleRegistry {
  private modules: Map<string, ModuleCapabilities> = new Map();
  private moduleAPIs: Map<string, ModuleAPI> = new Map();
  private initPromises: Map<string, Promise<void>> = new Map();

  /**
   * Register a module with its capabilities
   */
  register(name: string, capabilities: ModuleCapabilities | ModuleAPI) {
    // If only API is provided, wrap it in capabilities
    if (!('name' in capabilities)) {
      capabilities = {
        name,
        version: '1.0.0',
        api: capabilities as ModuleAPI,
      };
    }

    const moduleCapabilities = capabilities as ModuleCapabilities;

    this.modules.set(name, moduleCapabilities);

    if (moduleCapabilities.api) {
      this.moduleAPIs.set(name, moduleCapabilities.api);
    }

    // Emit registration event
    eventBus.emit('module:registered', {
      name,
      capabilities: moduleCapabilities,
    });

    console.log(
      `[ModuleRegistry] Registered module: ${name}`,
      moduleCapabilities
    );
  }

  /**
   * Unregister a module
   */
  unregister(name: string) {
    this.modules.delete(name);
    this.moduleAPIs.delete(name);
    this.initPromises.delete(name);

    eventBus.emit('module:unregistered', { name });
  }

  /**
   * Check if a module is available
   */
  isAvailable(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Get module capabilities
   */
  getCapabilities(name: string): ModuleCapabilities | undefined {
    return this.modules.get(name);
  }

  /**
   * Get module API
   */
  getAPI<T extends ModuleAPI = ModuleAPI>(name: string): T | undefined {
    return this.moduleAPIs.get(name) as T | undefined;
  }

  /**
   * Get all registered modules
   */
  getAllModules(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get modules that provide a specific feature
   */
  getModulesWithFeature(feature: string): string[] {
    const result: string[] = [];

    this.modules.forEach((capabilities, name) => {
      if (capabilities.provides?.features?.includes(feature)) {
        result.push(name);
      }
    });

    return result;
  }

  /**
   * Get modules that handle a specific entity
   */
  getModulesForEntity(entity: string): string[] {
    const result: string[] = [];

    this.modules.forEach((capabilities, name) => {
      if (capabilities.provides?.entities?.includes(entity)) {
        result.push(name);
      }
    });

    return result;
  }

  /**
   * Wait for a module to be available
   */
  async waitForModule(name: string, timeout = 5000): Promise<boolean> {
    if (this.isAvailable(name)) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = eventBus.on('module:registered', (data) => {
        if (data.name === name) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Call a module API method safely
   */
  async callAPI<T = unknown>(
    moduleName: string,
    methodName: string,
    ...args: unknown[]
  ): Promise<T | undefined> {
    const api = this.getAPI(moduleName);

    if (!api || !api[methodName]) {
      console.warn(
        `[ModuleRegistry] Method ${methodName} not found in module ${moduleName}`
      );
      return undefined;
    }

    try {
      return await api[methodName](...args);
    } catch (error) {
      console.error(
        `[ModuleRegistry] Error calling ${moduleName}.${methodName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get module dependencies
   */
  getDependencies(name: string): { required: string[]; optional: string[] } {
    const capabilities = this.modules.get(name);

    return {
      required: capabilities?.dependencies?.required || [],
      optional: capabilities?.dependencies?.optional || [],
    };
  }

  /**
   * Check if all required dependencies are met
   */
  areDependenciesMet(name: string): boolean {
    const { required } = this.getDependencies(name);
    return required.every((dep) => this.isAvailable(dep));
  }

  /**
   * Clear all registrations
   */
  clear() {
    this.modules.clear();
    this.moduleAPIs.clear();
    this.initPromises.clear();
  }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();

// Helper functions for common operations
export const registerModule = (
  name: string,
  api: ModuleAPI | ModuleCapabilities
) => moduleRegistry.register(name, api);

export const isModuleAvailable = (name: string) =>
  moduleRegistry.isAvailable(name);

export const getModuleAPI = <T extends ModuleAPI = ModuleAPI>(name: string) =>
  moduleRegistry.getAPI<T>(name);

export const callModuleAPI = <T = unknown>(
  moduleName: string,
  methodName: string,
  ...args: unknown[]
) => moduleRegistry.callAPI<T>(moduleName, methodName, ...args);
