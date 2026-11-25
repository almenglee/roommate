# roommate

# 기능

- 매칭
- 룸메 구하기 글 쓰기
- 필터 기능

# 유저 정보 / 프로필정보

```SQL
CREATE TABLE student (
    user_id UUID PRIMARY KEY,

    birth_year SMALLINT,             -- 계정 기본 정보
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    admission_year SMALLINT,

    nickname VARCHAR(30) NOT NULL,   -- 매칭 프로필 표시 정보
    major TEXT
);

CREATE TABLE profile (
    user_id UUID PRIMARY KEY REFERENCES student(user_id),
    nickname VARCHAR(30) NOT NULL,
    major TEXT,
    birth_year SMALLINT
);

CREATE TABLE profile_photo (
    photo_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profile(user_id),
    storage_key TEXT NOT NULL,
    display_order SMALLINT NOT NULL,

    UNIQUE (user_id, display_order)
);

```

# traits

```SQL
CREATE TABLE profile_traits (
    user_id UUID PRIMARY KEY REFERENCES profile(user_id),

    sleep_schedule TEXT CHECK (
        sleep_schedule IN ('early', 'regular', 'late', 'varies')
    ),
    wake_up_schedule TEXT CHECK (
        wake_up_schedule IN ('very_early', 'early', 'regular', 'late', 'varies')
    ),
    cleanliness TEXT CHECK (
        cleanliness IN ('very_tidy', 'tidy', 'relaxed', 'messy')
    ),
    noise_tolerance TEXT CHECK (
        noise_tolerance IN ('sensitive', 'normal', 'tolerant')
    ),
    lights_out TEXT CHECK (
        lights_out IN ('early', 'regular', 'late', 'no_preference')
    ),
    smoking TEXT CHECK (
        smoking IN ('no', 'occasionally', 'often')
    ),
    drinking TEXT CHECK (
        drinking IN ('no', 'occasionally', 'often', 'prefer_not_to_say')
    ),
    room_food TEXT CHECK (
        room_food IN ('rarely', 'sometimes', 'often')
    ),
    weekend_routine TEXT CHECK (
        weekend_routine IN ('mostly_out', 'mostly_in', 'mixed')
    ),
    snoring TEXT CHECK (
        snoring IN ('never', 'occasionally', 'often', 'unsure', 'prefer_not_to_say')
    ),
    room_call_frequency TEXT CHECK (
        room_call_frequency IN ('rarely', 'sometimes', 'often')
    )
);
```

| 필드                  | 사용자에게 보여줄 질문                   | 선택지 예시                                                                                        |
| --------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `sleep_schedule`      | 보통 몇 시쯤 잠자리에 드나요?            | 밤 10시 전 / 자정 이전 / 자정 이후 / 불규칙해요                                                    |
| `wake_up_schedule`    | 보통 몇 시쯤 일어나나요?                 | 오전 6시 전 / 오전 6~8시 / 오전 8~10시 / 오전 10시 이후 / 불규칙해요                               |
| `cleanliness`         | 평소 방을 얼마나 자주 정리하나요?        | 거의 매일 정리해요 / 일주일에 몇 번 정리해요 / 많이 어질러지면 정리해요 / 정리를 자주하지는 않아요 |
| `noise_tolerance`     | 소음에 얼마나 민감한 편인가요?           | 작은 소리에도 신경 쓰여요 / 보통이에요 / 어느 정도 소음은 괜찮아요                                 |
| `lights_out`          | 잘 때 방 조명은 어떻게 하는 게 편한가요? | 일찍 불을 꺼요 / 보통 시간에 꺼요 / 늦게까지 켜도 괜찮아요 / 상관없어요                            |
| `smoking`             | 흡연 빈도는 어느 정도인가요?             | 비흡연 / 가끔씩만 피워요 / 자주 피워요                                                             |
| `drinking`            | 음주 빈도는 어느 정도인가요?             | 마시지 않아요 / 가끔 마셔요 / 자주 마셔요 / 답변하고 싶지 않아요                                   |
| `room_food`           | 방에서 음식을 먹는 편인가요?             | 거의 먹지 않아요 / 가끔 먹어요 / 자주 먹어요                                                       |
| `weekend_routine`     | 주말에는 주로 어떻게 보내나요?           | 주로 외출해요 / 주로 방에서 보내요 / 반반이에요                                                    |
| `snoring`             | 잠잘 때 코를 고는 편인가요?              | 안 골아요 / 가끔 골아요 / 자주 골아요 / 잘 모르겠어요 / 답변하고 싶지 않아요                       |
| `room_call_frequency` | 방에서 통화를 자주 하는 편인가요?        | 거의 안 해요 / 가끔 해요 / 자주 해요                                                               |
