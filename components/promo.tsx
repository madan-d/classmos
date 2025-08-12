import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const Promo = () => {
  return (
    <div className="flex flex-col h-[600px] bg-gray-100">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl p-4 shadow max-w-md">
            <p className="text-gray-800 text-sm">Hello! How can I help you today?</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-blue-500 text-white rounded-2xl p-4 shadow max-w-md">
            <p className="text-sm">Tell me a joke.</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl p-4 shadow max-w-md">
            <p className="text-gray-800 text-sm">Why don’t scientists trust atoms? Because they make up everything.</p>
          </div>
        </div>
      </div>
      <div className="border-t bg-white p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Send a message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
