import {
  BadRequestException,
  Body,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CvApplicationsService } from './cv-applications.service';
import { SubmitCvApplicationDto } from './dto/submit-cv-application.dto';

const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_MAX_FILES = 2;

@ApiTags('cv-applications')
@Controller('cv-applications')
export class CvApplicationsController {
  constructor(private readonly cvApplicationsService: CvApplicationsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a public CV / job application' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'phone', 'cv'],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        message: { type: 'string' },
        cv: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: CV_MAX_FILES,
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('cv', CV_MAX_FILES))
  submit(
    @Body() dto: SubmitCvApplicationDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: CV_MAX_BYTES })],
        exceptionFactory: (error) =>
          new BadRequestException(
            error.includes('File is too large')
              ? 'File must be 5 MB or smaller.'
              : `File validation failed: ${error}`,
          ),
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.cvApplicationsService.submit(dto, files);
  }
}
