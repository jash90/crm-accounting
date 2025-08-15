import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Users, ShoppingCart, Send } from 'lucide-react';
import { ClientSelector } from './ClientSelector';
import { PriceListSelector } from './PriceListSelector';
import { OfferReview } from './OfferReview';
import { useOfferMutation } from '../hooks/useOfferMutation';
import type { CreateOfferData, OfferWizardStep } from '../types';

const STEPS: OfferWizardStep[] = [
  { step: 1, title: 'Choose Client', isComplete: false, isActive: true },
  { step: 2, title: 'Select Items', isComplete: false, isActive: false },
  { step: 3, title: 'Review & Send', isComplete: false, isActive: false },
];

export const OfferWizard: React.FC = () => {
  const navigate = useNavigate();
  const { createDraftOffer, sendOffer, loading } = useOfferMutation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState(STEPS);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Array<{ itemId: string; qty: number }>>([]);
  const [createdOfferId, setCreatedOfferId] = useState<string>('');

  const updateStepStatus = (stepNumber: number, isComplete: boolean, isActive: boolean) => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        isComplete: step.step < stepNumber ? true : step.step === stepNumber ? isComplete : false,
        isActive: step.step === stepNumber ? isActive : false,
      }))
    );
  };

  const handleNext = async () => {
    if (currentStep === 1 && selectedClientId) {
      updateStepStatus(2, false, true);
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedItems.length > 0) {
      // Create draft offer
      try {
        const offerData: CreateOfferData = {
          clientId: selectedClientId,
          items: selectedItems,
        };
        
        const offerId = await createDraftOffer(offerData);
        setCreatedOfferId(offerId);
        updateStepStatus(3, false, true);
        setCurrentStep(3);
      } catch (error) {
        console.error('Failed to create draft offer:', error);
      }
    } else if (currentStep === 3 && createdOfferId) {
      // Send offer
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await sendOffer(createdOfferId);
        navigate(`/offers/${createdOfferId}`);
      } catch (error) {
        console.error('Failed to send offer:', error);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      updateStepStatus(newStep, false, true);
      setCurrentStep(newStep);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedClientId;
      case 2:
        return selectedItems.length > 0;
      case 3:
        return !!createdOfferId;
      default:
        return false;
    }
  };

  const getStepIcon = (step: OfferWizardStep) => {
    if (step.isComplete) {
      return <Check className="h-5 w-5 text-white" />;
    }
    
    switch (step.step) {
      case 1:
        return <Users className="h-5 w-5" />;
      case 2:
        return <ShoppingCart className="h-5 w-5" />;
      case 3:
        return <Send className="h-5 w-5" />;
      default:
        return <div className="h-5 w-5" />;
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 1:
        return 'Select Items';
      case 2:
        return 'Review Offer';
      case 3:
        return loading ? 'Sending...' : 'Send Offer';
      default:
        return 'Next';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/offers')}
          className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Offer</h1>
          <p className="mt-1 text-gray-600">Follow the steps to create and send an offer to your client</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${step.isComplete ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  </div>
                )}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      step.isComplete
                        ? 'bg-blue-600 text-white'
                        : step.isActive
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {getStepIcon(step)}
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${step.isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {currentStep === 1 && (
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientSelect={setSelectedClientId}
          />
        )}
        
        {currentStep === 2 && (
          <PriceListSelector
            selectedItems={selectedItems}
            onItemsChange={setSelectedItems}
          />
        )}
        
        {currentStep === 3 && selectedClientId && (
          <OfferReview
            clientId={selectedClientId}
            items={selectedItems}
            offerId={createdOfferId}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonText()}
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};