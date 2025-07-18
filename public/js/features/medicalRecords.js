// Medical Records and Forms Management
export class MedicalRecordsManager {
    constructor() {
        this.dataManager = null;
    }

    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    createAddRecordForm() {
        return `
            <form id="add-record-form" class="space-y-4">
                <div>
                    <label for="record-title" class="block text-sm font-medium text-gray-700">Title</label>
                    <input 
                        type="text" 
                        id="record-title" 
                        name="title" 
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Medical visit, checkup, etc."
                    >
                </div>
                
                <div>
                    <label for="record-date" class="block text-sm font-medium text-gray-700">Date</label>
                    <input 
                        type="date" 
                        id="record-date" 
                        name="date" 
                        required
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                </div>
                
                <div>
                    <label for="record-hospital" class="block text-sm font-medium text-gray-700">Hospital/Clinic</label>
                    <input 
                        type="text" 
                        id="record-hospital" 
                        name="hospital"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Hospital or clinic name"
                    >
                </div>
                
                <div>
                    <label for="record-reason" class="block text-sm font-medium text-gray-700">Reason for Visit</label>
                    <textarea 
                        id="record-reason" 
                        name="reason" 
                        rows="3"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Why did you visit?"
                    ></textarea>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button 
                        type="button" 
                        class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                        Add Record
                    </button>
                </div>
            </form>
        `;
    }

    processFormData(form) {
        const formData = new FormData(form);
        return {
            title: formData.get('title'),
            date: formData.get('date'),
            hospital: formData.get('hospital'),
            reason: formData.get('reason'),
            createdAt: new Date().toISOString()
        };
    }
}
