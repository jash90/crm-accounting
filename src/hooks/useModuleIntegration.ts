/**
 * Hook for module integration and discovery
 * Provides utilities for modules to check for and interact with other modules
 */

import { useState, useEffect, useCallback } from 'react';
import {
  moduleRegistry,
  isModuleAvailable,
  getModuleAPI,
  callModuleAPI,
} from '@/lib/moduleRegistry';
import { eventBus } from '@/lib/eventBus';
import type { ModuleCapabilities, ModuleAPI } from '@/lib/moduleRegistry';

export interface ModuleIntegrationState {
  availableModules: string[];
  isLoading: boolean;
  error: Error | null;
}

export interface ModuleIntegrationReturn extends ModuleIntegrationState {
  isModuleAvailable: (name: string) => boolean;
  getModuleCapabilities: (name: string) => ModuleCapabilities | undefined;
  getModuleAPI: <T extends ModuleAPI = ModuleAPI>(
    name: string
  ) => T | undefined;
  callModuleMethod: <T = unknown>(
    moduleName: string,
    methodName: string,
    ...args: unknown[]
  ) => Promise<T | undefined>;
  waitForModule: (name: string, timeout?: number) => Promise<boolean>;
  getModulesWithFeature: (feature: string) => string[];
  getModulesForEntity: (entity: string) => string[];
  checkDependencies: (
    required?: string[],
    optional?: string[]
  ) => {
    missing: string[];
    available: string[];
    optional: string[];
  };
}

export function useModuleIntegration(): ModuleIntegrationReturn {
  const [state, setState] = useState<ModuleIntegrationState>({
    availableModules: moduleRegistry.getAllModules(),
    isLoading: false,
    error: null,
  });

  // Update available modules when modules are registered/unregistered
  useEffect(() => {
    const handleModuleRegistered = () => {
      setState((prev) => ({
        ...prev,
        availableModules: moduleRegistry.getAllModules(),
      }));
    };

    const handleModuleUnregistered = () => {
      setState((prev) => ({
        ...prev,
        availableModules: moduleRegistry.getAllModules(),
      }));
    };

    const unsubscribeRegistered = eventBus.on(
      'module:registered',
      handleModuleRegistered
    );
    const unsubscribeUnregistered = eventBus.on(
      'module:unregistered',
      handleModuleUnregistered
    );

    return () => {
      unsubscribeRegistered();
      unsubscribeUnregistered();
    };
  }, []);

  const checkModule = useCallback((name: string) => {
    return isModuleAvailable(name);
  }, []);

  const getCapabilities = useCallback((name: string) => {
    return moduleRegistry.getCapabilities(name);
  }, []);

  const getAPI = useCallback(
    <T extends ModuleAPI = ModuleAPI>(name: string) => {
      return getModuleAPI<T>(name);
    },
    []
  );

  const callMethod = useCallback(
    async <T = unknown>(
      moduleName: string,
      methodName: string,
      ...args: unknown[]
    ): Promise<T | undefined> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const result = await callModuleAPI<T>(moduleName, methodName, ...args);
        setState((prev) => ({ ...prev, isLoading: false }));
        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        console.error(`Error calling ${moduleName}.${methodName}:`, error);
        return undefined;
      }
    },
    []
  );

  const waitForModule = useCallback(
    async (name: string, timeout = 5000): Promise<boolean> => {
      return moduleRegistry.waitForModule(name, timeout);
    },
    []
  );

  const getModulesWithFeature = useCallback((feature: string): string[] => {
    return moduleRegistry.getModulesWithFeature(feature);
  }, []);

  const getModulesForEntity = useCallback((entity: string): string[] => {
    return moduleRegistry.getModulesForEntity(entity);
  }, []);

  const checkDependencies = useCallback(
    (required: string[] = [], optional: string[] = []) => {
      const missing: string[] = [];
      const available: string[] = [];
      const optionalAvailable: string[] = [];

      required.forEach((module) => {
        if (isModuleAvailable(module)) {
          available.push(module);
        } else {
          missing.push(module);
        }
      });

      optional.forEach((module) => {
        if (isModuleAvailable(module)) {
          optionalAvailable.push(module);
        }
      });

      return {
        missing,
        available,
        optional: optionalAvailable,
      };
    },
    []
  );

  return {
    ...state,
    isModuleAvailable: checkModule,
    getModuleCapabilities: getCapabilities,
    getModuleAPI: getAPI,
    callModuleMethod: callMethod,
    waitForModule,
    getModulesWithFeature,
    getModulesForEntity,
    checkDependencies,
  };
}

// Specific hook for the clients module
export function useClientsModuleIntegration() {
  const integration = useModuleIntegration();

  // Check for commonly related modules
  const hasInvoices = integration.isModuleAvailable('Invoices');
  const hasContracts = integration.isModuleAvailable('Contracts');
  const hasDocuments = integration.isModuleAvailable('Documents');
  const hasTasks = integration.isModuleAvailable('Tasks');
  const hasReports = integration.isModuleAvailable('Reports');

  // Get APIs for available modules
  const invoicesAPI = hasInvoices
    ? integration.getModuleAPI('Invoices')
    : undefined;
  const contractsAPI = hasContracts
    ? integration.getModuleAPI('Contracts')
    : undefined;
  const documentsAPI = hasDocuments
    ? integration.getModuleAPI('Documents')
    : undefined;

  return {
    ...integration,
    features: {
      canGenerateInvoices: hasInvoices,
      canManageContracts: hasContracts,
      canAttachDocuments: hasDocuments,
      canAssignTasks: hasTasks,
      canGenerateReports: hasReports,
    },
    apis: {
      invoices: invoicesAPI,
      contracts: contractsAPI,
      documents: documentsAPI,
    },
  };
}
