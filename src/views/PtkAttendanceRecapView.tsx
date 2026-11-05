import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { PtkAttendanceRecapTab } from '../components/piket/PtkAttendanceRecapTab';
import { DailyWorkingHour } from '../types';

export const PtkAttendanceRecapView: React.FC = () => {
  const { currentUser } = useAuth();
  const profile = DataService.getSchoolProfile();
  const teachers = DataService.getTeachers();
  const staffList = DataService.getStaff();
  const dutyJournals = DataService.getDutyJournals();
  const [workingHours, setWorkingHours] = useState<DailyWorkingHour[]>(() =>
    DataService.getWorkingHoursConfig()
  );

  const handleUpdateWorkingHours = (hours: DailyWorkingHour[]) => {
    setWorkingHours(hours);
    DataService.saveWorkingHoursConfig(hours, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });
  };

  return (
    <div className="space-y-6">
      <PtkAttendanceRecapTab
        profile={profile}
        teachers={teachers}
        staffList={staffList}
        dutyJournals={dutyJournals}
        currentUser={currentUser}
        workingHours={workingHours}
        onUpdateWorkingHours={handleUpdateWorkingHours}
      />
    </div>
  );
};
