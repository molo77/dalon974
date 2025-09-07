"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer la suppression",
  description = "Cette action est irréversible.",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[9999]">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-200"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
              <Dialog.Title className="text-lg font-bold mb-4">
                {title}
              </Dialog.Title>
              <p className="mb-6 text-gray-700">{description}</p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
