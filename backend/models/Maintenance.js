import mongoose from 'mongoose';

const MaintenanceSchema = new mongoose.Schema({
  maintenanceId: { type: String, required: true, unique: true },
  roomNumber: { type: String, required: true, index: true },
  issueDescription: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Reported', 'In Progress', 'Completed'], 
    default: 'In Progress',
    index: true
  },
  reportedBy: { type: String, default: 'Manager' },
  reportedByRole: { type: String, default: 'manager' },
  resolutionNotes: { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  resolvedDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);

