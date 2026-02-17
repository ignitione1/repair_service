import { IsIn, IsOptional, IsString } from 'class-validator';

const requestStatuses = ['new', 'assigned', 'in_progress', 'done', 'canceled'] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export class ListRequestsQuery {
  @IsOptional()
  @IsString()
  @IsIn(requestStatuses)
  status?: RequestStatus;
}
