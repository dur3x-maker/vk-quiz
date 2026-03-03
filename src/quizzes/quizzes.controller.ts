import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizResponseDto, QuizListItemDto } from './dto/quiz-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Quizzes')
@ApiBearerAuth('access-token')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles(Role.ORGANIZER)
  @ApiOperation({ summary: 'Create a new quiz (Organizer only)' })
  @ApiResponse({
    status: 201,
    description: 'Quiz successfully created',
    type: QuizResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Organizer role required' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createQuizDto: CreateQuizDto,
  ): Promise<QuizResponseDto> {
    return this.quizzesService.create(userId, createQuizDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes' })
  @ApiResponse({
    status: 200,
    description: 'List of quizzes',
    type: [QuizListItemDto],
  })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ): Promise<QuizListItemDto[]> {
    return this.quizzesService.findAll(userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({
    status: 200,
    description: 'Quiz details',
    type: QuizResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findOne(@Param('id') id: string): Promise<QuizResponseDto> {
    return this.quizzesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ORGANIZER)
  @ApiOperation({ summary: 'Update quiz (Organizer only, owner)' })
  @ApiResponse({
    status: 200,
    description: 'Quiz successfully updated',
    type: QuizResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ): Promise<QuizResponseDto> {
    return this.quizzesService.update(id, userId, updateQuizDto);
  }

  @Delete(':id')
  @Roles(Role.ORGANIZER)
  @ApiOperation({ summary: 'Delete quiz (Organizer only, owner)' })
  @ApiResponse({ status: 200, description: 'Quiz successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ message: string }> {
    await this.quizzesService.remove(id, userId);
    return { message: 'Quiz successfully deleted' };
  }
}
