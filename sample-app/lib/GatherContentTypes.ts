/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Template {
  id: number;
  name: string;
  number_of_items_using: number;
  structure_uuid: string;
  project_id: number;
  /** UTC string */
  updated_at: string;
  updated_by: number;
}

export interface Item {
  id: number;
  project_id: number;
  status_id: number;
  folder_uuid: string;
  template_id: number;
  structure_uuid: string;
  position: number;
  name: string;
  archived_by: number | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  next_due_at: string;
  completed_at: string | null;
  assigned_user_ids: number[];
  assignee_count: number;
  current_workflow_assigned_user_ids: number[];
  structure?: {
    uuid: string;
    groups: [
      {
        uuid: string;
        name: string;
        fields: [
          {
            uuid: string;
            label: string;
            instructions: string;
            field_type: string;
            metadata: Record<string, any>;
          }
        ];
      }
    ];
  };
  content: {
    [fieldUuid: string]: any;
  };
  mappedContent: {
    [fieldName: string]: {
      uuid: string;
      label: string;
      instructions: string;
      field_type: string;
      metadata: Record<string, any>;
      value: any;
    };
  };
}
