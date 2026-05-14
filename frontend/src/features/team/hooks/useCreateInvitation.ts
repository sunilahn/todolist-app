import { useMutation } from '@tanstack/react-query';
import { createInvitation } from '../api/team.api';
import type { CreateInvitationRequest } from '../types/team.types';

export function useCreateInvitation(teamId: string) {
  return useMutation({
    mutationFn: (data: CreateInvitationRequest) => createInvitation(teamId, data),
  });
}
