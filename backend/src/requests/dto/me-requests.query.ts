import { IsIn, IsOptional, IsString } from 'class-validator';

const meStatuses = ['assigned', 'in_progress', 'done', 'canceled'] as const;

export type MasterVisibleStatus = (typeof meStatuses)[number];

export class MeRequestsQuery {
  @IsOptional()
  @IsString()
  @IsIn(meStatuses)
  status?: MasterVisibleStatus;
}
