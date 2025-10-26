import BaseService from '../base/BaseService';

class LeaveService extends BaseService {
    constructor() {
        super('/hrm/leave');
    }

    // Leave Categories
    async getCategories(params = {}) {
        return this.getList('categories', params);
    }

    async createCategory(data) {
        return this.create('categories', data);
    }

    async updateCategory(id, data) {
        return this.update('categories', id, data);
    }

    async deleteCategory(id) {
        return this.delete('categories', id);
    }

    // Leave Entitlements
    async getEntitlements(params = {}) {
        return this.getList('entitlements', params);
    }

    async createEntitlement(data) {
        return this.create('entitlements', data);
    }

    async updateEntitlement(id, data) {
        return this.update('entitlements', id, data);
    }

    async deleteEntitlement(id) {
        return this.delete('entitlements', id);
    }

    // Leave Requests
    async getRequests(params = {}) {
        return this.getList('requests', params);
    }

    async validateLeave(data) {
        return this.create('requests/validate', data);
    }

    async createRequest(data) {
        return this.create('requests', data);
    }

    async updateRequest(id, data) {
        return this.update('requests', id, data);
    }

    async deleteRequest(id) {
        return this.delete('requests', id);
    }

    async approveRequest(id) {
        return this.performAction('requests', id, 'approve');
    }

    async rejectRequest(id, reason) {
        return this.performAction('requests', id, 'reject', { rejection_reason: reason });
    }

    // Leave Balances
    async getBalances(params = {}) {
        return this.getList('balances', params);
    }

    async createBalance(data) {
        return this.create('balances', data);
    }

    async updateBalance(id, data) {
        return this.update('balances', id, data);
    }

    async deleteBalance(id) {
        return this.delete('balances', id);
    }

    // Leave Logs
    async getLogs(params = {}) {
        return this.getList('logs', params);
    }
}

export const leaveService = new LeaveService();
